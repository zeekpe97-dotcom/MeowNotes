use std::{
    fs,
    path::{Path, PathBuf},
};

use serde::{de::DeserializeOwned, Serialize};
use tauri::{AppHandle, Manager};

use crate::{
    models::{
        ai::AiProviderConfig,
        app::AppPaths,
        assets::AssetRecord,
        notes::NoteRecord,
    },
    services::error::{AppError, AppResult},
};

#[derive(Debug, Clone)]
pub struct FileStorage {
    app_data_dir: PathBuf,
    vault_dir: PathBuf,
    assets_dir: PathBuf,
    logs_dir: PathBuf,
    storage_dir: PathBuf,
}

impl FileStorage {
    pub fn from_app(app: &AppHandle) -> AppResult<Self> {
        let app_data_dir = app.path().app_data_dir().map_err(|error| {
            AppError::InvalidInput(format!("failed to resolve app data dir: {error}"))
        })?;
        let storage = Self {
            vault_dir: app_data_dir.join("vault"),
            assets_dir: app_data_dir.join("assets"),
            logs_dir: app_data_dir.join("logs").join("app"),
            storage_dir: app_data_dir.join("storage"),
            app_data_dir,
        };
        storage.ensure_layout()?;
        Ok(storage)
    }

    pub fn paths(&self) -> AppPaths {
        AppPaths {
            app_data_dir: path_to_string(&self.app_data_dir),
            vault_dir: path_to_string(&self.vault_dir),
            assets_dir: path_to_string(&self.assets_dir),
            logs_dir: path_to_string(&self.logs_dir),
            storage_dir: path_to_string(&self.storage_dir),
        }
    }

    pub fn notes(&self) -> AppResult<Vec<NoteRecord>> {
        self.read_json_or_default(&self.notes_index_path())
    }

    pub fn save_notes(&self, notes: &[NoteRecord]) -> AppResult<()> {
        self.write_json(&self.notes_index_path(), notes)
    }

    pub fn assets(&self) -> AppResult<Vec<AssetRecord>> {
        self.read_json_or_default(&self.assets_index_path())
    }

    pub fn save_assets(&self, assets: &[AssetRecord]) -> AppResult<()> {
        self.write_json(&self.assets_index_path(), assets)
    }

    pub fn save_ai_provider(&self, config: &AiProviderConfig) -> AppResult<()> {
        self.write_json(&self.ai_provider_path(), config)
    }

    pub fn read_ai_provider(&self) -> AppResult<Option<AiProviderConfig>> {
        if !self.ai_provider_path().exists() {
            return Ok(None);
        }
        self.read_json(&self.ai_provider_path()).map(Some)
    }

    pub fn note_path(&self, note_id: &str) -> PathBuf {
        self.vault_dir.join(format!("{note_id}.md"))
    }

    pub fn asset_path(&self, file_name: &str) -> PathBuf {
        self.assets_dir.join(file_name)
    }

    pub fn read_note_content(&self, note_id: &str) -> AppResult<String> {
        Ok(fs::read_to_string(self.note_path(note_id))?)
    }

    pub fn write_note_content(&self, note_id: &str, content: &str) -> AppResult<PathBuf> {
        let path = self.note_path(note_id);
        fs::write(&path, content)?;
        Ok(path)
    }

    pub fn copy_asset(&self, source: &Path, stored_file_name: &str) -> AppResult<PathBuf> {
        let target = self.asset_path(stored_file_name);
        fs::copy(source, &target)?;
        Ok(target)
    }

    fn ensure_layout(&self) -> AppResult<()> {
        fs::create_dir_all(&self.app_data_dir)?;
        fs::create_dir_all(&self.vault_dir)?;
        fs::create_dir_all(&self.assets_dir)?;
        fs::create_dir_all(&self.logs_dir)?;
        fs::create_dir_all(&self.storage_dir)?;
        Ok(())
    }

    fn notes_index_path(&self) -> PathBuf {
        self.storage_dir.join("notes.json")
    }

    fn assets_index_path(&self) -> PathBuf {
        self.storage_dir.join("assets.json")
    }

    fn ai_provider_path(&self) -> PathBuf {
        self.storage_dir.join("ai_provider.json")
    }

    fn read_json_or_default<T>(&self, path: &Path) -> AppResult<T>
    where
        T: DeserializeOwned + Default,
    {
        if !path.exists() {
            return Ok(T::default());
        }
        self.read_json(path)
    }

    fn read_json<T>(&self, path: &Path) -> AppResult<T>
    where
        T: DeserializeOwned,
    {
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }

    fn write_json<T>(&self, path: &Path, value: &T) -> AppResult<()>
    where
        T: Serialize + ?Sized,
    {
        let content = serde_json::to_string_pretty(value)?;
        fs::write(path, content)?;
        Ok(())
    }
}

pub fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}
