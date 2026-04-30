use chrono::Utc;

use crate::{
    models::cat::{CatInteractRequest, CatInteractResponse},
    services::error::{AppError, AppResult},
};

pub fn interact(request: CatInteractRequest) -> AppResult<CatInteractResponse> {
    let action = request.action.trim();
    if action.is_empty() {
        return Err(AppError::InvalidInput("action is required".to_string()));
    }

    let energy = match action {
        "feed" => 95,
        "play" => 75,
        "sleep" => 40,
        _ => 60,
    };
    let target = request
        .note_id
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| "workspace".to_string());

    Ok(CatInteractResponse {
        mood: mood_for(action).to_string(),
        energy,
        message: format!("cat action '{action}' applied to {target}"),
        interacted_at: Utc::now(),
    })
}

fn mood_for(action: &str) -> &'static str {
    match action {
        "feed" => "satisfied",
        "play" => "curious",
        "sleep" => "calm",
        _ => "idle",
    }
}
