use super::fees::FeeTracker;
use super::state::*;
use crate::config::AppConfig;
use crate::exchanges::mexc::MexcClient;
use crate::exchanges::poloniex::PoloniexClient;
use crate::exchanges::ExchangeClient;
use chrono::Utc;
use uuid::Uuid;

pub struct ArbitrageEngine {
    pub config: AppConfig,
    pub is_running: bool,
    pub phase: CyclePhase,
    pub cycle_count: u32,
    pub total_profit: f64,
    pub start_time: Option<i64>,
    pub current_cycle: Option<CycleRecord>,
    pub history: Vec<CycleRecord>,
    pub last_prices: Option<PriceSpread>,
    pub fee_tracker: Option<FeeTracker>,
    pub poloniex_client: Option<PoloniexClient>,
    pub mexc_client: Option<MexcClient>,
    // Cycle state tracking
    pub trn_quantity: Option<f64>,
    pub buy_price: Option<f64>,
    // Deposit polling state
    pub withdrawal_initiated_at: Option<i64>,
    pub deposit_poll_attempts: u32,
    // Paper trading state
    pub paper_balances: PaperBalances,
}

#[derive(Debug, Clone)]
pub struct PaperBalances {
    pub poloniex_usdt: f64,
    pub poloniex_trn: f64,
    pub mexc_usdt: f64,
    pub mexc_trn: f64,
}

impl PaperBalances {
    pub fn new(initial_usdt: f64) -> Self {
        Self {
            poloniex_usdt: initial_usdt,
            poloniex_trn: 0.0,
            mexc_usdt: 0.0,
            mexc_trn: 0.0,
        }
    }

    pub fn to_balances(&self) -> Balances {
        Balances {
            poloniex_usdt: self.poloniex_usdt,
            poloniex_trn: self.poloniex_trn,
            mexc_usdt: self.mexc_usdt,
            mexc_trn: self.mexc_trn,
        }
    }
}

impl ArbitrageEngine {
    pub fn new(config: AppConfig) -> Self {
        let paper_balances = PaperBalances::new(config.transfer_amount_usdt);

        let poloniex_client = if !config.paper_trading && !config.poloniex_api_key.is_empty() {
            Some(PoloniexClient::new(&config))
        } else {
            None
        };

        let mexc_client = if !config.paper_trading && !config.mexc_api_key.is_empty() {
            Some(MexcClient::new(&config))
        } else {
            None
        };

        Self {
            config,
            is_running: false,
            phase: CyclePhase::Idle,
            cycle_count: 0,
            total_profit: 0.0,
            start_time: None,
            current_cycle: None,
            history: Vec::new(),
            last_prices: None,
            fee_tracker: None,
            poloniex_client,
            mexc_client,
            trn_quantity: None,
            buy_price: None,
            withdrawal_initiated_at: None,
            deposit_poll_attempts: 0,
            paper_balances,
        }
    }

    pub async fn start(&mut self, amount: f64) -> anyhow::Result<()> {
        if self.is_running {
            return Err(anyhow::anyhow!("Engine is already running"));
        }

        self.is_running = true;
        self.start_time = Some(Utc::now().timestamp());
        self.phase = CyclePhase::Monitoring;
        self.withdrawal_initiated_at = None;
        self.deposit_poll_attempts = 0;

        if self.config.paper_trading {
            self.paper_balances = PaperBalances::new(amount);
        }

        // Initialize fee tracker (in live mode, fetch from APIs)
        let poloniex_fee = if self.config.paper_trading {
            5.0 // Estimated TRN withdrawal fee
        } else {
            let client = self.poloniex_client.as_ref().unwrap();
            client.get_withdrawal_fee("TRN", &self.config.poloniex_trn_network).await?.withdrawal_fee
        };
        let mexc_fee = if self.config.paper_trading {
            1.0 // Estimated USDT BEP20 withdrawal fee
        } else {
            let client = self.mexc_client.as_ref().unwrap();
            client.get_withdrawal_fee("USDT", &self.config.poloniex_usdt_network).await?.withdrawal_fee
        };
        self.fee_tracker = Some(FeeTracker::new(poloniex_fee, mexc_fee));

        let cycle = CycleRecord {
            id: Uuid::new_v4().to_string(),
            cycle_number: self.cycle_count + 1,
            start_amount_usdt: amount,
            phase: CyclePhase::Monitoring,
            buy_price: None,
            sell_price: None,
            trn_quantity: None,
            gross_profit: None,
            fees: None,
            net_profit: None,
            started_at: Utc::now().timestamp(),
            completed_at: None,
            status: "running".to_string(),
        };
        self.current_cycle = Some(cycle);

        tracing::info!("Arbitrades engine started: amount={amount} USDT, paper={}", self.config.paper_trading);
        Ok(())
    }

    pub fn stop(&mut self) {
        self.is_running = false;
        self.phase = CyclePhase::Idle;

        if let Some(mut cycle) = self.current_cycle.take() {
            cycle.status = "stopped".to_string();
            cycle.completed_at = Some(Utc::now().timestamp());
            self.history.push(cycle);
        }

        tracing::info!("Arbitrades engine stopped");
    }

    pub async fn tick(&mut self) -> anyhow::Result<()> {
        if !self.is_running {
            return Ok(());
        }

        // Check 24-hour auto-stop
        if let Some(start) = self.start_time {
            let elapsed = Utc::now().timestamp() - start;
            let duration_secs = (self.config.cycle_duration_hours * 3600) as i64;
            if elapsed >= duration_secs {
                tracing::info!("24-hour cycle complete. Auto-stopping engine.");
                self.stop();
                return Ok(());
            }
        }

        match self.phase {
            CyclePhase::Monitoring => self.step_monitor().await?,
            CyclePhase::BuyTRN => self.step_buy_trn().await?,
            CyclePhase::BuyConfirmed => self.step_transfer_trn().await?,
            CyclePhase::TransferTRN => self.step_wait_trn_deposit().await?,
            CyclePhase::TRNDeposited => self.step_sell_trn().await?,
            CyclePhase::SellTRN => self.step_confirm_sell().await?,
            CyclePhase::SellConfirmed => self.step_transfer_usdt().await?,
            CyclePhase::TransferUSDT => self.step_confirm_cycle().await?,
            _ => {}
        }

        Ok(())
    }

    async fn step_monitor(&mut self) -> anyhow::Result<()> {
        let poloniex_price = if self.config.paper_trading {
            let base = 0.045;
            let noise = (chrono::Utc::now().timestamp_millis() % 100) as f64 / 100000.0;
            base + noise
        } else {
            let client = self.poloniex_client.as_ref().unwrap();
            client.get_ticker_price(&self.config.trading_pair_poloniex).await?.price
        };

        let mexc_price = if self.config.paper_trading {
            let base = 0.047;
            let noise = (chrono::Utc::now().timestamp_millis() % 80) as f64 / 100000.0;
            base + noise
        } else {
            let client = self.mexc_client.as_ref().unwrap();
            client.get_ticker_price(&self.config.trading_pair_mexc).await?.price
        };

        let spread = mexc_price - poloniex_price; // Buy low on Poloniex, sell high on MEXC
        let spread_pct = (spread / poloniex_price) * 100.0;

        self.last_prices = Some(PriceSpread {
            poloniex_price,
            mexc_price,
            spread,
            spread_percent: spread_pct,
        });

        // Only trade if spread is positive (MEXC higher than Poloniex) and above threshold
        if spread_pct >= self.config.spread_threshold_percent {
            tracing::info!("Spread detected: {spread_pct:.2}% - buying TRN on Poloniex");
            self.phase = CyclePhase::BuyTRN;
            if let Some(cycle) = &mut self.current_cycle {
                cycle.phase = CyclePhase::BuyTRN;
            }
        }

        Ok(())
    }

    async fn step_buy_trn(&mut self) -> anyhow::Result<()> {
        let amount = self.current_cycle.as_ref().map(|c| c.start_amount_usdt).unwrap_or(self.config.transfer_amount_usdt);
        let buy_price = self.last_prices.as_ref().map(|p| p.poloniex_price).unwrap_or(0.045);

        if self.config.paper_trading {
            let trn_qty = amount / buy_price;
            self.paper_balances.poloniex_usdt -= amount;
            self.paper_balances.poloniex_trn += trn_qty;
            self.trn_quantity = Some(trn_qty);
            self.buy_price = Some(buy_price);

            if let Some(cycle) = &mut self.current_cycle {
                cycle.buy_price = Some(buy_price);
                cycle.trn_quantity = Some(trn_qty);
            }

            tracing::info!("Paper buy: {trn_qty:.4} TRN at {buy_price:.6} USDT");
        } else {
            let client = self.poloniex_client.as_ref().unwrap();
            let order = client.place_market_buy(&self.config.trading_pair_poloniex, amount).await?;
            self.trn_quantity = Some(order.filled_qty);
            self.buy_price = Some(order.filled_price);

            if let Some(cycle) = &mut self.current_cycle {
                cycle.buy_price = Some(order.filled_price);
                cycle.trn_quantity = Some(order.filled_qty);
            }

            tracing::info!("Live buy: {} TRN at {} USDT", order.filled_qty, order.filled_price);
        }

        self.phase = CyclePhase::BuyConfirmed;
        if let Some(cycle) = &mut self.current_cycle {
            cycle.phase = CyclePhase::BuyConfirmed;
        }
        Ok(())
    }

    async fn step_transfer_trn(&mut self) -> anyhow::Result<()> {
        let qty = self.trn_quantity.unwrap();

        if self.config.paper_trading {
            self.paper_balances.poloniex_trn -= qty;
            self.paper_balances.mexc_trn += qty;
            tracing::info!("Paper transfer: {qty:.4} TRN from Poloniex to MEXC via Arbitrum One");
        } else {
            let client = self.poloniex_client.as_ref().unwrap();
            let result = client.withdraw(
                "TRN",
                qty,
                &self.config.mexc_trn_deposit_address,
                &self.config.poloniex_trn_network,
            ).await?;
            self.withdrawal_initiated_at = Some(Utc::now().timestamp());
            self.deposit_poll_attempts = 0;
            tracing::info!("TRN withdrawal initiated: id={}", result.withdraw_id);
        }

        self.phase = CyclePhase::TransferTRN;
        if let Some(cycle) = &mut self.current_cycle {
            cycle.phase = CyclePhase::TransferTRN;
        }
        Ok(())
    }

    async fn step_wait_trn_deposit(&mut self) -> anyhow::Result<()> {
        if self.config.paper_trading {
            // Paper mode: instant deposit confirmation
            self.phase = CyclePhase::TRNDeposited;
            if let Some(cycle) = &mut self.current_cycle {
                cycle.phase = CyclePhase::TRNDeposited;
            }
            tracing::info!("Paper: TRN deposit confirmed on MEXC");
        } else {
            // Live mode: poll MEXC deposit history for TRN
            self.deposit_poll_attempts += 1;
            let client = self.mexc_client.as_ref().unwrap();
            let deposits = client.get_deposit_history("TRN").await?;

            let initiated_at = self.withdrawal_initiated_at.unwrap_or(0);
            let deposit_confirmed = deposits.iter().any(|d| {
                d.currency == "TRN"
                    && d.status == "success"
                    && d.timestamp >= initiated_at
            });

            if deposit_confirmed {
                self.phase = CyclePhase::TRNDeposited;
                if let Some(cycle) = &mut self.current_cycle {
                    cycle.phase = CyclePhase::TRNDeposited;
                }
                tracing::info!("TRN deposit confirmed on MEXC after {} poll attempts", self.deposit_poll_attempts);
            } else {
                tracing::info!("Waiting for TRN deposit on MEXC (attempt {})", self.deposit_poll_attempts);
                // Auto-stop after 100 attempts (~200 seconds) to avoid infinite loop
                if self.deposit_poll_attempts >= 100 {
                    tracing::warn!("Deposit not confirmed after {} attempts, stopping cycle", self.deposit_poll_attempts);
                    self.stop();
                }
            }
        }
        Ok(())
    }

    async fn step_sell_trn(&mut self) -> anyhow::Result<()> {
        let qty = self.trn_quantity.unwrap();
        let sell_price = self.last_prices.as_ref().map(|p| p.mexc_price).unwrap_or(0.047);

        if self.config.paper_trading {
            let usdt_received = qty * sell_price;
            self.paper_balances.mexc_trn -= qty;
            self.paper_balances.mexc_usdt += usdt_received;

            if let Some(cycle) = &mut self.current_cycle {
                cycle.sell_price = Some(sell_price);
            }

            tracing::info!("Paper sell: {qty:.4} TRN at {sell_price:.6} USDT = {usdt_received:.4} USDT");
        } else {
            let client = self.mexc_client.as_ref().unwrap();
            let order = client.place_market_sell(&self.config.trading_pair_mexc, qty).await?;

            if let Some(cycle) = &mut self.current_cycle {
                cycle.sell_price = Some(order.filled_price);
            }

            tracing::info!("Live sell: {} TRN at {} USDT", order.filled_qty, order.filled_price);
        }

        self.phase = CyclePhase::SellTRN;
        if let Some(cycle) = &mut self.current_cycle {
            cycle.phase = CyclePhase::SellTRN;
        }
        Ok(())
    }

    async fn step_confirm_sell(&mut self) -> anyhow::Result<()> {
        self.phase = CyclePhase::SellConfirmed;
        if let Some(cycle) = &mut self.current_cycle {
            cycle.phase = CyclePhase::SellConfirmed;
        }
        tracing::info!("Sell confirmed");
        Ok(())
    }

    async fn step_transfer_usdt(&mut self) -> anyhow::Result<()> {
        let principal = self.current_cycle.as_ref().map(|c| c.start_amount_usdt).unwrap_or(self.config.transfer_amount_usdt);

        if self.config.paper_trading {
            // Only transfer principal back, profit stays on MEXC
            self.paper_balances.mexc_usdt -= principal;
            self.paper_balances.poloniex_usdt += principal;
            tracing::info!("Paper transfer: {principal:.4} USDT principal back to Poloniex via BSC BEP20");
        } else {
            let client = self.mexc_client.as_ref().unwrap();
            let result = client.withdraw(
                "USDT",
                principal,
                &self.config.poloniex_usdt_deposit_address,
                &self.config.poloniex_usdt_network,
            ).await?;
            tracing::info!("USDT withdrawal initiated: id={}", result.withdraw_id);
        }

        self.phase = CyclePhase::TransferUSDT;
        if let Some(cycle) = &mut self.current_cycle {
            cycle.phase = CyclePhase::TransferUSDT;
        }
        Ok(())
    }

    async fn step_confirm_cycle(&mut self) -> anyhow::Result<()> {
        let buy_price = self.buy_price.unwrap_or(0.0);
        let sell_price = self.last_prices.as_ref().map(|p| p.mexc_price).unwrap_or(0.0);
        let amount = self.current_cycle.as_ref().map(|c| c.start_amount_usdt).unwrap_or(0.0);

        let fees = self.fee_tracker.as_ref().map(|ft| ft.calculate(amount, buy_price, sell_price));
        let gross_profit = if sell_price > 0.0 && buy_price > 0.0 {
            let trn_qty = amount / buy_price;
            let trn_after_fee = trn_qty - self.fee_tracker.as_ref().map(|ft| ft.poloniex_trn_withdrawal_fee).unwrap_or(0.0);
            (trn_after_fee * sell_price) - amount
        } else {
            0.0
        };
        let net_profit = fees.as_ref().map(|f| f.estimated_net_profit).unwrap_or(gross_profit);

        if let Some(mut cycle) = self.current_cycle.take() {
            cycle.gross_profit = Some(gross_profit);
            cycle.fees = fees;
            cycle.net_profit = Some(net_profit);
            cycle.status = "completed".to_string();
            cycle.completed_at = Some(Utc::now().timestamp());
            cycle.phase = CyclePhase::CycleComplete;
            self.total_profit += net_profit;
            self.cycle_count += 1;
            self.history.push(cycle);
        }

        // Restart cycle with same principal
        let next_amount = self.config.transfer_amount_usdt;
        let _ = self.start(next_amount).await;

        tracing::info!("Cycle complete! Gross: {gross_profit:.4}, Net: {net_profit:.4} USDT. Starting next cycle.");
        Ok(())
    }

    pub async fn get_status(&self) -> EngineStatus {
        let uptime = self.start_time
            .map(|t| (Utc::now().timestamp() - t) as u64)
            .unwrap_or(0);

        let remaining = if let Some(start) = self.start_time {
            let duration = self.config.cycle_duration_hours * 3600;
            let elapsed = (Utc::now().timestamp() - start) as u64;
            if elapsed >= duration { 0 } else { duration - elapsed }
        } else {
            self.config.cycle_duration_hours * 3600
        };

        let balances = if self.config.paper_trading {
            Some(self.paper_balances.to_balances())
        } else {
            // Fetch live balances from both exchanges
            self.fetch_live_balances().await
        };

        EngineStatus {
            is_running: self.is_running,
            mode: if self.config.paper_trading { "paper".to_string() } else { "live".to_string() },
            current_phase: self.phase.clone(),
            cycles_completed: self.cycle_count,
            total_profit: self.total_profit,
            uptime_seconds: uptime,
            remaining_seconds: remaining,
            start_time: self.start_time,
            prices: self.last_prices.clone(),
            current_cycle: self.current_cycle.clone(),
            history: self.history.clone(),
            balances,
            fees: self.fee_tracker.as_ref().map(|ft| FeeBreakdown {
                poloniex_trn_withdrawal: ft.poloniex_trn_withdrawal_fee,
                mexc_usdt_withdrawal: ft.mexc_usdt_withdrawal_fee,
                total_fees: ft.poloniex_trn_withdrawal_fee * self.buy_price.unwrap_or(0.045) + ft.mexc_usdt_withdrawal_fee,
                estimated_net_profit: 0.0,
            }),
        }
    }

    async fn fetch_live_balances(&self) -> Option<Balances> {
        let poloniex = self.poloniex_client.as_ref()?;
        let mexc = self.mexc_client.as_ref()?;

        let poloniex_balances = poloniex.get_balances().await.ok()?;
        let mexc_balances = mexc.get_balances().await.ok()?;

        let find_balance = |balances: &[super::super::exchanges::Balance], currency: &str| -> f64 {
            balances.iter()
                .find(|b| b.currency == currency)
                .map(|b| b.available)
                .unwrap_or(0.0)
        };

        Some(Balances {
            poloniex_usdt: find_balance(&poloniex_balances, "USDT"),
            poloniex_trn: find_balance(&poloniex_balances, "TRN"),
            mexc_usdt: find_balance(&mexc_balances, "USDT"),
            mexc_trn: find_balance(&mexc_balances, "TRN"),
        })
    }
}
