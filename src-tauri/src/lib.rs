pub mod commands;
pub mod models;
pub mod services;
pub mod storage;

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::app::app_bootstrap,
            commands::notes::note_create,
            commands::notes::note_read,
            commands::notes::note_update_content,
            commands::notes::note_search,
            commands::assets::asset_import,
            commands::ai::ai_provider_save,
            commands::ai::ai_chat,
            commands::cat::cat_interact,
            commands::graph::graph_get
        ])
        .run(tauri::generate_context!())
        .expect("failed to run MeowNotes desktop app");
}
