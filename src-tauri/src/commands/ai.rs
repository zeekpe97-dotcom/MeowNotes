use tauri::AppHandle;

use crate::{
    models::ai::{AiChatRequest, AiChatResponse, AiProviderConfig, AiProviderSaveRequest},
    services::{ai, error::to_command_error},
    storage::FileStorage,
};

#[tauri::command]
pub fn ai_provider_save(
    app_handle: AppHandle,
    request: AiProviderSaveRequest,
) -> Result<AiProviderConfig, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    ai::save_provider(&storage, request).map_err(to_command_error)
}

#[tauri::command]
pub fn ai_chat(
    app_handle: AppHandle,
    request: AiChatRequest,
) -> Result<AiChatResponse, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    ai::chat(&storage, request).map_err(to_command_error)
}
