mod api;
mod arb;
mod config;
mod exchanges;

use api::create_router;
use config::AppConfig;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<RwLock<AppConfig>>,
    pub engine: Arc<RwLock<arb::ArbitrageEngine>>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenv::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("info".parse()?))
        .init();

    let config = AppConfig::from_env()?;
    let port = config.engine_port;

    let state = AppState {
        config: Arc::new(RwLock::new(config.clone())),
        engine: Arc::new(RwLock::new(arb::ArbitrageEngine::new(config))),
    };

    // Spawn background tick loop to drive the engine state machine
    let engine_handle = state.engine.clone();
    tokio::spawn(async move {
        let tick_interval = std::time::Duration::from_secs(2);
        loop {
            tokio::time::sleep(tick_interval).await;
            let mut engine = engine_handle.write().await;
            if let Err(e) = engine.tick().await {
                tracing::error!("Engine tick error: {e}");
            }
        }
    });

    let app = create_router(state);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!("Techub Arbitrades Engine running on port {port}");

    axum::serve(listener, app).await?;
    Ok(())
}
