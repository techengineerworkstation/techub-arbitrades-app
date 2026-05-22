use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CyclePhase {
    Idle,
    Monitoring,
    BuyTRN,
    BuyConfirmed,
    TransferTRN,
    TRNDeposited,
    SellTRN,
    SellConfirmed,
    TransferUSDT,
    CycleComplete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceSpread {
    pub poloniex_price: f64,
    pub mexc_price: f64,
    pub spread: f64,
    pub spread_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeBreakdown {
    pub poloniex_trn_withdrawal: f64,
    pub mexc_usdt_withdrawal: f64,
    pub total_fees: f64,
    pub estimated_net_profit: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CycleRecord {
    pub id: String,
    pub cycle_number: u32,
    pub start_amount_usdt: f64,
    pub phase: CyclePhase,
    pub buy_price: Option<f64>,
    pub sell_price: Option<f64>,
    pub trn_quantity: Option<f64>,
    pub gross_profit: Option<f64>,
    pub fees: Option<FeeBreakdown>,
    pub net_profit: Option<f64>,
    pub started_at: i64,
    pub completed_at: Option<i64>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balances {
    pub poloniex_usdt: f64,
    pub poloniex_trn: f64,
    pub mexc_usdt: f64,
    pub mexc_trn: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineStatus {
    pub is_running: bool,
    pub mode: String,
    pub current_phase: CyclePhase,
    pub cycles_completed: u32,
    pub total_profit: f64,
    pub uptime_seconds: u64,
    pub remaining_seconds: u64,
    pub start_time: Option<i64>,
    pub prices: Option<PriceSpread>,
    pub current_cycle: Option<CycleRecord>,
    pub history: Vec<CycleRecord>,
    pub balances: Option<Balances>,
    pub fees: Option<FeeBreakdown>,
}
