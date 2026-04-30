use tauri::AppHandle;

use crate::{
    models::graph::GraphResponse,
    services::{error::to_command_error, graph},
    storage::FileStorage,
};

#[tauri::command]
pub fn graph_get(app_handle: AppHandle) -> Result<GraphResponse, String> {
    let storage = FileStorage::from_app(&app_handle).map_err(to_command_error)?;
    graph::get_graph(&storage).map_err(to_command_error)
}
