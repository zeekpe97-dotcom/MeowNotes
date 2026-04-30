use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatInteractRequest {
    pub action: String,
    pub note_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatInteractResponse {
    pub mood: String,
    pub energy: u8,
    pub message: String,
    pub interacted_at: DateTime<Utc>,
}
