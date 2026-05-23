use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub poloniex_api_key: String,
    pub poloniex_secret_key: String,
    pub mexc_api_key: String,
    pub mexc_secret_key: String,
    pub trading_pair_poloniex: String,
    pub trading_pair_mexc: String,
    pub transfer_amount_usdt: f64,
    pub cycle_duration_hours: u64,
    pub spread_threshold_percent: f64,
    pub engine_port: u16,
    pub paper_trading: bool,
    // Deposit/withdrawal addresses
    pub poloniex_trn_deposit_address: String,
    pub poloniex_trn_network: String,
    pub mexc_trn_deposit_address: String,
    pub mexc_trn_network: String,
    pub poloniex_usdt_deposit_address: String,
    pub poloniex_usdt_network: String,
    pub trn_contract_address: String,
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            poloniex_api_key: std::env::var("POLONIEX_API_KEY").unwrap_or_default(),
            poloniex_secret_key: std::env::var("POLONIEX_SECRET_KEY").unwrap_or_default(),
            mexc_api_key: std::env::var("MEXC_API_KEY").unwrap_or_default(),
            mexc_secret_key: std::env::var("MEXC_SECRET_KEY").unwrap_or_default(),
            trading_pair_poloniex: std::env::var("TRADING_PAIR_POLONIEX")
                .unwrap_or_else(|_| "TRX_USDT".to_string()),
            trading_pair_mexc: std::env::var("TRADING_PAIR_MEXC")
                .unwrap_or_else(|_| "TRNUSDT".to_string()),
            transfer_amount_usdt: std::env::var("TRANSFER_AMOUNT_USDT")
                .unwrap_or_else(|_| "15".to_string())
                .parse()?,
            cycle_duration_hours: std::env::var("CYCLE_DURATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()?,
            spread_threshold_percent: std::env::var("SPREAD_THRESHOLD_PERCENT")
                .unwrap_or_else(|_| "0.5".to_string())
                .parse()?,
            engine_port: std::env::var("ENGINE_PORT")
                .unwrap_or_else(|_| "3001".to_string())
                .parse()?,
            paper_trading: std::env::var("PAPER_TRADING")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
            poloniex_trn_deposit_address: std::env::var("POLONIEX_TRN_DEPOSIT_ADDRESS")
                .unwrap_or_else(|_| "0x434ceef5f307712ed569597e80d6c7d8caae0e96".to_string()),
            poloniex_trn_network: std::env::var("POLONIEX_TRN_NETWORK")
                .unwrap_or_else(|_| "ETHARB".to_string()),
            mexc_trn_deposit_address: std::env::var("MEXC_TRN_DEPOSIT_ADDRESS")
                .unwrap_or_else(|_| "0x5a4ca1917ba6a9b2708feefbd31b6613c3e67712".to_string()),
            mexc_trn_network: std::env::var("MEXC_TRN_NETWORK")
                .unwrap_or_else(|_| "ARBITRUM_ONE".to_string()),
            poloniex_usdt_deposit_address: std::env::var("POLONIEX_USDT_DEPOSIT_ADDRESS")
                .unwrap_or_else(|_| "0x434ceef5f307712ed569597e80d6c7d8caae0e96".to_string()),
            poloniex_usdt_network: std::env::var("POLONIEX_USDT_NETWORK")
                .unwrap_or_else(|_| "BSC_BEP20".to_string()),
            trn_contract_address: std::env::var("TRN_CONTRACT_ADDRESS")
                .unwrap_or_else(|_| "0x1114982539A2Bfb84e8b9e4e320bbC04532a9e44".to_string()),
        })
    }
}
