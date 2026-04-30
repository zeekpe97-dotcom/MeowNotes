use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPaths {
    pub app_data_dir: String,
    pub vault_dir: String,
    pub assets_dir: String,
    pub logs_dir: String,
    pub storage_dir: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapResponse {
    pub paths: AppPaths,
    pub ready: bool,
}
