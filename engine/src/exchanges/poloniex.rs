use super::{Balance, ExchangeClient, FeeInfo, OrderResult, TickerPrice, WithdrawResult};
use crate::config::AppConfig;
use async_trait::async_trait;
use hmac::{Hmac, Mac};
use reqwest::Client;
use sha2::Sha256;
use std::time::{SystemTime, UNIX_EPOCH};

type HmacSha256 = Hmac<Sha256>;

pub struct PoloniexClient {
    client: Client,
    api_key: String,
    secret_key: String,
    base_url: String,
}

impl PoloniexClient {
    pub fn new(config: &AppConfig) -> Self {
        Self {
            client: Client::new(),
            api_key: config.poloniex_api_key.clone(),
            secret_key: config.poloniex_secret_key.clone(),
            base_url: "https://api.poloniex.com".to_string(),
        }
    }

    fn timestamp(&self) -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }

    fn sign(&self, method: &str, path: &str, query: &str, body: &str, ts: u64) -> String {
        let sign_str = format!("{method}\n{path}\n{query}\n{ts}\n{body}");
        let mut mac = HmacSha256::new_from_slice(self.secret_key.as_bytes())
            .expect("HMAC can take key of any size");
        mac.update(sign_str.as_bytes());
        hex::encode(mac.finalize().into_bytes())
    }

    fn auth_headers(&self, method: &str, path: &str, query: &str, body: &str) -> Vec<(String, String)> {
        let ts = self.timestamp();
        let signature = self.sign(method, path, query, body, ts);
        vec![
            ("key".to_string(), self.api_key.clone()),
            ("signature".to_string(), signature),
            ("signatureMethod".to_string(), "HmacSHA256".to_string()),
            ("signatureVersion".to_string(), "2".to_string()),
            ("timestamp".to_string(), ts.to_string()),
        ]
    }
}

#[async_trait]
impl ExchangeClient for PoloniexClient {
    async fn get_ticker_price(&self, symbol: &str) -> anyhow::Result<TickerPrice> {
        let url = format!("{}/markets/{}/ticker", self.base_url, symbol);
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;

        let price = resp["markPrice"]
            .as_str()
            .or_else(|| resp["lastTradePrice"].as_str())
            .ok_or_else(|| anyhow::anyhow!("No price in Poloniex response"))?
            .parse::<f64>()?;

        Ok(TickerPrice {
            symbol: symbol.to_string(),
            price,
            timestamp: chrono::Utc::now().timestamp_millis(),
        })
    }

    async fn get_balances(&self) -> anyhow::Result<Vec<Balance>> {
        let path = "/accounts/balances";
        let query = "";
        let headers = self.auth_headers("GET", path, query, "");

        let mut req = self.client.get(format!("{}{}", self.base_url, path));
        for (k, v) in &headers {
            req = req.header(k.as_str(), v.as_str());
        }

        let resp: serde_json::Value = req.send().await?.json().await?;

        let mut balances = Vec::new();
        if let Some(arr) = resp.as_array() {
            for item in arr {
                let available = item["available"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                let frozen = item["frozen"].as_str().unwrap_or("0").parse::<f64>().unwrap_or(0.0);
                if available > 0.0 || frozen > 0.0 {
                    balances.push(Balance {
                        currency: item["currency"].as_str().unwrap_or("").to_string(),
                        available,
                        frozen,
                    });
                }
            }
        }
        Ok(balances)
    }

    async fn place_market_buy(&self, symbol: &str, quote_qty: f64) -> anyhow::Result<OrderResult> {
        let path = "/orders";
        let body = serde_json::json!({
            "symbol": symbol,
            "side": "BUY",
            "type": "MARKET",
            "quoteAmount": quote_qty.to_string(),
        });
        let body_str = body.to_string();
        let headers = self.auth_headers("POST", path, "", &body_str);

        let mut req = self.client
            .post(format!("{}{}", self.base_url, path))
            .header("Content-Type", "application/json")
            .body(body_str.clone());
        for (k, v) in &headers {
            req = req.header(k.as_str(), v.as_str());
        }

        let resp: serde_json::Value = req.send().await?.json().await?;

        Ok(OrderResult {
            order_id: resp["id"].as_str().unwrap_or("").to_string(),
            status: resp["state"].as_str().unwrap_or("NEW").to_string(),
            filled_qty: resp["filledAmount"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
            filled_price: resp["avgPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        })
    }

    async fn place_market_sell(&self, symbol: &str, qty: f64) -> anyhow::Result<OrderResult> {
        let path = "/orders";
        let body = serde_json::json!({
            "symbol": symbol,
            "side": "SELL",
            "type": "MARKET",
            "amount": qty.to_string(),
        });
        let body_str = body.to_string();
        let headers = self.auth_headers("POST", path, "", &body_str);

        let mut req = self.client
            .post(format!("{}{}", self.base_url, path))
            .header("Content-Type", "application/json")
            .body(body_str.clone());
        for (k, v) in &headers {
            req = req.header(k.as_str(), v.as_str());
        }

        let resp: serde_json::Value = req.send().await?.json().await?;

        Ok(OrderResult {
            order_id: resp["id"].as_str().unwrap_or("").to_string(),
            status: resp["state"].as_str().unwrap_or("NEW").to_string(),
            filled_qty: resp["filledAmount"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
            filled_price: resp["avgPrice"].as_str().unwrap_or("0").parse().unwrap_or(0.0),
        })
    }

    async fn withdraw(&self, currency: &str, amount: f64, address: &str, network: &str) -> anyhow::Result<WithdrawResult> {
        let path = "/withdrawals";
        let body = serde_json::json!({
            "currency": currency,
            "amount": amount.to_string(),
            "address": address,
            "network": network,
        });
        let body_str = body.to_string();
        let headers = self.auth_headers("POST", path, "", &body_str);

        let mut req = self.client
            .post(format!("{}{}", self.base_url, path))
            .header("Content-Type", "application/json")
            .body(body_str.clone());
        for (k, v) in &headers {
            req = req.header(k.as_str(), v.as_str());
        }

        let resp: serde_json::Value = req.send().await?.json().await?;

        Ok(WithdrawResult {
            withdraw_id: resp["id"].as_str().unwrap_or("").to_string(),
            status: resp["status"].as_str().unwrap_or("PROCESSING").to_string(),
        })
    }

    async fn get_withdrawal_fee(&self, currency: &str, network: &str) -> anyhow::Result<FeeInfo> {
        let url = format!("{}/currencies/{}/fees", self.base_url, currency);
        let resp: serde_json::Value = self.client.get(&url).send().await?.json().await?;

        let mut fee = 0.0;
        if let Some(chains) = resp["chains"].as_array() {
            for chain in chains {
                if chain["chain"].as_str().unwrap_or("") == network {
                    fee = chain["withdrawalFee"].as_str().unwrap_or("0").parse().unwrap_or(0.0);
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
