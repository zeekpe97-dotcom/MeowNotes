use crate::{
    models::cat::{CatInteractRequest, CatInteractResponse},
    services::{cat, error::to_command_error},
};

#[tauri::command]
pub fn cat_interact(request: CatInteractRequest) -> Result<CatInteractResponse, String> {
    cat::interact(request).map_err(to_command_error)
}
