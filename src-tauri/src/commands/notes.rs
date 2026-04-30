use tauri::AppHandle;

use crate::{
    models::notes::{
        NoteCreateRequest, NoteDetailResponse, NoteReadRequest, NoteRecord, NoteSearchRequest,
        NoteSearchResponse, NoteUpdateContentRequest,
    },
    services::{error::to_command_error, notes},
    storage::FileStorage,
};

#[tauri::command]
pub fn note_create(
    app_handle: AppHandle,
    request: NoteCreateRequest,
) -> Result<NoteRecord, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    notes::create_note(&storage, request).map_err(to_command_error)
}

#[tauri::command]
pub fn note_update_content(
    app_handle: AppHandle,
    request: NoteUpdateContentRequest,
) -> Result<NoteRecord, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    notes::update_note_content(&storage, request).map_err(to_command_error)
}

#[tauri::command]
pub fn note_read(
    app_handle: AppHandle,
    request: NoteReadRequest,
) -> Result<NoteDetailResponse, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    notes::read_note(&storage, request).map_err(to_command_error)
}

#[tauri::command]
pub fn note_search(
    app_handle: AppHandle,
    request: NoteSearchRequest,
) -> Result<NoteSearchResponse, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    notes::search_notes(&storage, request).map_err(to_command_error)
}
