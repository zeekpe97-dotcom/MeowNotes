use tauri::AppHandle;

use crate::{
    models::assets::{AssetImportRequest, AssetRecord},
    services::{assets, error::to_command_error},
    storage::FileStorage,
};

#[tauri::command]
pub fn asset_import(
    app_handle: AppHandle,
    request: AssetImportRequest,
) -> Result<AssetRecord, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    assets::import_asset(&storage, request).map_err(to_command_error)
}
