use chrono::Utc;

use crate::{
    models::ai::{
        AiChatRequest, AiChatResponse, AiProviderConfig, AiProviderSaveRequest, ChatMessage,
    },
    services::error::{AppError, AppResult},
    storage::FileStorage,
};

pub fn save_provider(
    storage: &FileStorage,
    request: AiProviderSaveRequest,
) -> AppResult<AiProviderConfig> {
    if request.provider.trim().is_empty() {
        return Err(AppError::InvalidInput("provider is required".to_string()));
    }
    if request.model.trim().is_empty() {
        return Err(AppError::InvalidInput("model is required".to_string()));
    }

    let config = AiProviderConfig {
        provider: request.provider.trim().to_string(),
        base_url: request.base_url.map(|value| value.trim().to_string()),
        api_key: request.api_key.map(|value| value.trim().to_string()),
        model: request.model.trim().to_string(),
        updated_at: Utc::now(),
    };

    storage.save_ai_provider(&config)?;
    Ok(config)
}

pub fn chat(storage: &FileStorage, request: AiChatRequest) -> AppResult<AiChatResponse> {
    let provider = request
        .provider
        .filter(|value| !value.trim().is_empty())
        .or_else(|| {
            storage
                .read_ai_provider()
                .ok()
                .flatten()
                .map(|config| config.provider)
        })
        .unwrap_or_else(|| "local-stub".to_string());

    let last_user_message = request
        .messages
        .iter()
        .rev()
        .find(|message| message.role == "user")
        .map(|message| message.content.as_str())
        .unwrap_or("");

    let content = if last_user_message.is_empty() {
        "AI chat command is ready. Provide a user message to continue.".to_string()
    } else {
        format!(
            "AI provider '{provider}' is not connected yet. Received: {last_user_message}"
        )
    };

    Ok(AiChatResponse {
        provider,
        message: ChatMessage {
            role: "assistant".to_string(),
            content,
            created_at: Some(Utc::now()),
        },
    })
}
