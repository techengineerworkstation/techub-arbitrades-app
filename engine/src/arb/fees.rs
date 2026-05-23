use crate::arb::state::FeeBreakdown;

pub struct FeeTracker {
    pub poloniex_trn_withdrawal_fee: f64,
    pub mexc_usdt_withdrawal_fee: f64,
}

impl FeeTracker {
    pub fn new(poloniex_trn_fee: f64, mexc_usdt_fee: f64) -> Self {
        Self {
            poloniex_trn_withdrawal_fee: poloniex_trn_fee,
            mexc_usdt_withdrawal_fee: mexc_usdt_fee,
        }
    }

    pub fn calculate(&self, buy_amount_usdt: f64, buy_price: f64, sell_price: f64) -> FeeBreakdown {
        // TRN quantity bought
        let trn_qty = buy_amount_usdt / buy_price;

        // USDT received from selling (gross)
        let _usdt_from_sell = trn_qty * sell_price;

        // The TRN withdrawal fee is deducted from TRN amount before selling
        // So actual TRN sold = trn_qty - trn_withdrawal_fee
        let trn_after_fee = trn_qty - self.poloniex_trn_withdrawal_fee;
        let usdt_after_sell = trn_after_fee * sell_price;

        // Gross profit before MEXC USDT withdrawal fee
        let gross_before_mexc_fee = usdt_after_sell - buy_amount_usdt;

        // Net profit after both fees
        let net_profit = gross_before_mexc_fee - self.mexc_usdt_withdrawal_fee;

        FeeBreakdown {
            poloniex_trn_withdrawal: self.poloniex_trn_withdrawal_fee,
            mexc_usdt_withdrawal: self.mexc_usdt_withdrawal_fee,
            total_fees: self.poloniex_trn_withdrawal_fee * buy_price + self.mexc_usdt_withdrawal_fee,
            estimated_net_profit: net_profit,
        }
    }

    /// Calculate the principal amount to transfer back (buy_amount only, profit stays on MEXC)
    pub fn principal_transfer_amount(&self, buy_amount_usdt: f64) -> f64 {
        buy_amount_usdt - self.mexc_usdt_withdrawal_fee
    }
}
