use super::{Balance, ExchangeClient, FeeInfo, OrderResult, TickerPrice, WithdrawResult};
use crate::config::AppConfig;
use async_trait::async_trait;
use hmac::{Hmac, Mac};
use reqwest::Client;
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub struct MexcClient {
    client: Client,
    api_key: String,
    secret_key: String,
    base_url: String,
}

impl MexcClient {
    pub fn new(config: &AppConfig) -> Self {
        Self {
            client: Client::new(),
            api_key: config.mexc_api_key.clone(),
            secret_key: config.mexc_secret_key.clone(),
            base_url: "https://api.mexc.com".to_string(),
        }
    }

    fn sign(&self, query_string: &str) -> String {
        let mut mac = HmacSha256::new_from_slice(self.secret_key.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(query_string.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    fn timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }
}

#[async_trait]
impl ExchangeClient for MexcClient {
    async fn get_ticker_price(&self, symbol: &str) -> anyhow::Result<TickerPrice> {
        let url = format!("{}/api/v3/ticker/price?symbol={}", self.base_url, symbol);
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;

        let price = resp["price"]
            .as_str()
            .ok_or_else(|| anyhow::anyhow!("No price in MEXC response"))?
            .parse::<f64>()?;

        Ok(TickerPrice {
            symbol: symbol.to_string(),
            price,
            timestamp: chrono::Utc::now().timestamp_millis(),
        })
    }

    async fn get_balances(&self) -> anyhow::Result<Vec<Balance>> {
        let ts = self.timestamp();
        let query = format!("timestamp={ts}");
        let signature = self.sign(&query);

        let url = format!("{}/api/v3/account?{}&signature={}", self.base_url, query, signature);
        let resp: serde_json::Value = self
            .client
            .get(&url)
            .header("X-MEXC-APIKEY", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        let mut balances = Vec::new();
        if let Some(arr) = resp["balances"].as_array() {
            for item in arr {
                let free = item["free"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                let locked = item["locked"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                if free > 0.0 || locked > 0.0 {
                    balances.push(Balance {
                        currency: item["asset"].as_str().unwrap_or("").to_string(),
                        available: free,
                        frozen: locked,
                    });
                }
            }
        }
        Ok(balances)
    }

    async fn place_market_buy(&self, symbol: &str, quote_qty: f64) -> anyhow::Result<OrderResult> {
        let ts = self.timestamp();
        let query = format!("symbol={symbol}&side=BUY&type=MARKET&quoteOrderQty={quote_qty}&timestamp={ts}");
        let signature = self.sign(&query);

        let url = format!("{}/api/v3/order?{}&signature={}", self.base_url, query, signature);
        let resp: serde_json::Value = self
            .client
            .post(&url)
            .header("X-MEXC-APIKEY", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        Ok(OrderResult {
            order_id: resp["orderId"].as_str().unwrap_or("").to_string(),
            status: resp["status"].as_str().unwrap_or("NEW").to_string(),
            filled_qty: resp["executedQty"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
            filled_price: resp["cummulativeQuoteQty"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        })
    }

    async fn place_market_sell(&self, symbol: &str, qty: f64) -> anyhow::Result<OrderResult> {
        let ts = self.timestamp();
        let query = format!("symbol={symbol}&side=SELL&type=MARKET&quantity={qty}&timestamp={ts}");
        let signature = self.sign(&query);

        let url = format!("{}/api/v3/order?{}&signature={}", self.base_url, query, signature);
        let resp: serde_json::Value = self
            .client
            .post(&url)
            .header("X-MEXC-APIKEY", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        Ok(OrderResult {
            order_id: resp["orderId"].as_str().unwrap_or("").to_string(),
            status: resp["status"].as_str().unwrap_or("NEW").to_string(),
            filled_qty: resp["executedQty"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
            filled_price: resp["cummulativeQuoteQty"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        })
    }

    async fn withdraw(&self, currency: &str, amount: f64, address: &str, network: &str) -> anyhow::Result<WithdrawResult> {
        let ts = self.timestamp();
        let query = format!("coin={currency}&amount={amount}&address={address}&network={network}&timestamp={ts}");
        let signature = self.sign(&query);

        let url = format!("{}/api/v3/capital/withdraw?{}&signature={}", self.base_url, query, signature);
        let resp: serde_json::Value = self
            .client
            .post(&url)
            .header("X-MEXC-APIKEY", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        Ok(WithdrawResult {
            withdraw_id: resp["id"].as_str().unwrap_or("").to_string(),
            status: "pending".to_string(),
        })
    }

    async fn get_withdrawal_fee(&self, currency: &str, network: &str) -> anyhow::Result<FeeInfo> {
        let ts = self.timestamp();
        let query = format!("timestamp={ts}");
        let signature = self.sign(&query);

        let url = format!("{}/api/v3/capital/config/getall?{}&signature={}", self.base_url, query, signature);
        let resp: serde_json::Value = self
            .client
            .get(&url)
            .header("X-MEXC-APIKEY", &self.api_key)
            .send()
            .await?
            .json()
            .await?;

        let mut fee = 0.0;
        if let Some(arr) = resp.as_array() {
            for coin in arr {
                if coin["coin"].as_str().unwrap_or("") == currency {
                    if let Some(networks) = coin["networkList"].as_array() {
                        for net in networks {
                            if net["network"].as_str().unwrap_or("") == network
                                || net["name"].as_str().unwrap_or("").contains(network)
                            {
                                fee = net["withdrawFee"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
                                break;
                            }
                        }
                    }
                    break;
                }
            }
        }

        Ok(FeeInfo {
            currency: currency.to_string(),
            network: network.to_string(),
            withdrawal_fee: fee,
        })
    }
}
