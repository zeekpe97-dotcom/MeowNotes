use tauri::AppHandle;

use crate::{
    models::app::BootstrapResponse,
    services::{app, error::to_command_error},
};

#[tauri::command]
pub fn app_bootstrap(app_handle: AppHandle) -> Result<BootstrapResponse, String> {
    app::bootstrap(&app_handle).map_err(to_command_error)
}
