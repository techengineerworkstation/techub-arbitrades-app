pub mod mexc;
pub mod poloniex;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TickerPrice {
    pub symbol: String,
    pub price: f64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Balance {
    pub currency: String,
    pub available: f64,
    pub frozen: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderResult {
    pub order_id: String,
    pub status: String,
    pub filled_qty: f64,
    pub filled_price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithdrawResult {
    pub withdraw_id: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeeInfo {
    pub currency: String,
    pub network: String,
    pub withdrawal_fee: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepositRecord {
    pub id: String,
    pub currency: String,
    pub amount: f64,
    pub status: String, // "pending", "success", "failed"
    pub network: String,
    pub timestamp: i64,
}

#[async_trait]
pub trait ExchangeClient: Send + Sync {
    async fn get_ticker_price(&self, symbol: &str) -> anyhow::Result<TickerPrice>;
    async fn get_balances(&self) -> anyhow::Result<Vec<Balance>>;
    async fn place_market_buy(&self, symbol: &str, quote_qty: f64) -> anyhow::Result<OrderResult>;
    async fn place_market_sell(&self, symbol: &str, qty: f64) -> anyhow::Result<OrderResult>;
    async fn withdraw(&self, currency: &str, amount: f64, address: &str, network: &str) -> anyhow::Result<WithdrawResult>;
    async fn get_withdrawal_fee(&self, currency: &str, network: &str) -> anyhow::Result<FeeInfo>;
    async fn get_deposit_history(&self, currency: &str) -> anyhow::Result<Vec<DepositRecord>>;
}
