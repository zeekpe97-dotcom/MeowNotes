use std::path::Path;

use chrono::Utc;
use uuid::Uuid;

use crate::{
    models::assets::{AssetImportRequest, AssetRecord},
    services::error::{AppError, AppResult},
    storage::{path_to_string, FileStorage},
};

pub fn import_asset(storage: &FileStorage, request: AssetImportRequest) -> AppResult<AssetRecord> {
    let source = Path::new(request.source_path.trim());
    if request.source_path.trim().is_empty() {
        return Err(AppError::InvalidInput("source_path is required".to_string()));
    }
    if !source.is_file() {
        return Err(AppError::NotFound(format!(
            "asset source {}",
            source.to_string_lossy()
        )));
    }

    let id = Uuid::new_v4().to_string();
    let extension = source
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_lowercase());
    let stored_file_name = match extension {
        Some(ext) if !ext.is_empty() => format!("{id}.{ext}"),
        _ => id.clone(),
    };
    let stored_path = storage.copy_asset(source, &stored_file_name)?;

    let asset = AssetRecord {
        id,
        original_path: path_to_string(source),
        stored_path: path_to_string(&stored_path),
        file_name: stored_file_name,
        mime_type: mime_from_path(source),
        created_at: Utc::now(),
    };

    let mut assets = storage.assets()?;
    assets.push(asset.clone());
    storage.save_assets(&assets)?;
    Ok(asset)
}

fn mime_from_path(path: &Path) -> String {
    match path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .as_deref()
    {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("png") => "image/png",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("bmp") => "image/bmp",
        _ => "application/octet-stream",
    }
    .to_string()
}
