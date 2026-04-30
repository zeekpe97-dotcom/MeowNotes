use tauri::AppHandle;

use crate::{
    models::app::BootstrapResponse,
    services::error::AppResult,
    storage::FileStorage,
};

pub fn bootstrap(app: &AppHandle) -> AppResult<BootstrapResponse> {
    let storage = FileStorage::from_app(app)?;
    Ok(BootstrapResponse {
        paths: storage.paths(),
        ready: true,
    })
}
