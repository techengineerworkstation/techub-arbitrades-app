use crate::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;

#[derive(Deserialize)]
pub struct StartRequest {
    pub amount: f64,
}

#[derive(Deserialize)]
pub struct UpdateConfigRequest {
    pub spread_threshold: Option<f64>,
    pub transfer_amount: Option<f64>,
    pub cycle_duration_hours: Option<u64>,
}

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

pub fn create_router(state: AppState) -> Router {
    Router::new()
        .route("/api/status", get(get_status))
        .route("/api/start", post(start_engine))
        .route("/api/stop", post(stop_engine))
        .route("/api/config", post(update_config))
        .route("/api/history", get(get_history))
        .route("/api/prices", get(get_prices))
        .route("/api/fees", get(get_fees))
        .route("/api/health", get(health))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

async fn health() -> Json<ApiResponse<&'static str>> {
    Json(ApiResponse {
        success: true,
        data: Some("Techub Arbitrades Engine is running"),
        error: None,
    })
}

async fn get_status(State(state): State<AppState>) -> Json<ApiResponse<serde_json::Value>> {
    let engine = state.engine.read().await;
    let status = engine.get_status();
    Json(ApiResponse {
        success: true,
        data: Some(serde_json::to_value(status).unwrap()),
        error: None,
    })
}

async fn start_engine(
    State(state): State<AppState>,
    Json(req): Json<StartRequest>,
) -> Result<Json<ApiResponse<&'static str>>, StatusCode> {
    let mut engine = state.engine.write().await;

    match engine.start(req.amount).await {
        Ok(()) => Ok(Json(ApiResponse {
            success: true,
            data: Some("Engine started"),
            error: None,
        })),
        Err(e) => Ok(Json(ApiResponse {
            success: false,
            data: None,
            error: Some(e.to_string()),
        })),
    }
}

async fn stop_engine(State(state): State<AppState>) -> Json<ApiResponse<&'static str>> {
    let mut engine = state.engine.write().await;
    engine.stop();
    Json(ApiResponse {
        success: true,
        data: Some("Engine stopped"),
        error: None,
    })
}

async fn update_config(
    State(state): State<AppState>,
    Json(req): Json<UpdateConfigRequest>,
) -> Json<ApiResponse<&'static str>> {
    let mut config = state.config.write().await;
    if let Some(threshold) = req.spread_threshold {
        config.spread_threshold_percent = threshold;
    }
    if let Some(amount) = req.transfer_amount {
        config.transfer_amount_usdt = amount;
    }
    if let Some(hours) = req.cycle_duration_hours {
        config.cycle_duration_hours = hours;
    }
    Json(ApiResponse {
        success: true,
        data: Some("Config updated"),
        error: None,
    })
}

async fn get_history(State(state): State<AppState>) -> Json<ApiResponse<serde_json::Value>> {
    let engine = state.engine.read().await;
    let status = engine.get_status();
    Json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "history": status.history,
            "cycles_completed": status.cycles_completed,
            "total_profit": status.total_profit,
        })),
        error: None,
    })
}

async fn get_prices(State(state): State<AppState>) -> Json<ApiResponse<serde_json::Value>> {
    let engine = state.engine.read().await;
    let status = engine.get_status();
    Json(ApiResponse {
        success: true,
        data: status.prices.map(|p| serde_json::to_value(p).unwrap()),
        error: None,
    })
}

async fn get_fees(State(state): State<AppState>) -> Json<ApiResponse<serde_json::Value>> {
    let engine = state.engine.read().await;
    let status = engine.get_status();
    Json(ApiResponse {
        success: true,
        data: status.fees.map(|f| serde_json::to_value(f).unwrap()),
        error: None,
    })
}
