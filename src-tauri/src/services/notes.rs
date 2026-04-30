use chrono::Utc;
use uuid::Uuid;

use crate::{
    models::notes::{
        NoteCreateRequest, NoteDetailResponse, NoteReadRequest, NoteRecord, NoteSearchItem,
        NoteSearchRequest, NoteSearchResponse, NoteUpdateContentRequest,
    },
    services::error::{AppError, AppResult},
    storage::{path_to_string, FileStorage},
};

pub fn create_note(storage: &FileStorage, request: NoteCreateRequest) -> AppResult<NoteRecord> {
    let title = normalized_title(&request.title)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now();
    let content = request
        .content
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| format!("# {title}\n\n"));
    let markdown_path = storage.write_note_content(&id, &content)?;

    let note = NoteRecord {
        id,
        title,
        markdown_path: path_to_string(&markdown_path),
        created_at: now,
        updated_at: now,
    };

    let mut notes = storage.notes()?;
    notes.push(note.clone());
    storage.save_notes(&notes)?;
    Ok(note)
}

pub fn update_note_content(
    storage: &FileStorage,
    request: NoteUpdateContentRequest,
) -> AppResult<NoteRecord> {
    if request.note_id.trim().is_empty() {
        return Err(AppError::InvalidInput("note_id is required".to_string()));
    }

    let mut notes = storage.notes()?;
    let note = notes
        .iter_mut()
        .find(|item| item.id == request.note_id)
        .ok_or_else(|| AppError::NotFound(format!("note {}", request.note_id)))?;

    let content = request
        .content
        .or(request.markdown)
        .ok_or_else(|| AppError::InvalidInput("content is required".to_string()))?;
    storage.write_note_content(&note.id, &content)?;
    note.updated_at = Utc::now();
    let updated = note.clone();
    storage.save_notes(&notes)?;
    Ok(updated)
}

pub fn read_note(storage: &FileStorage, request: NoteReadRequest) -> AppResult<NoteDetailResponse> {
    if request.note_id.trim().is_empty() {
        return Err(AppError::InvalidInput("note_id is required".to_string()));
    }

    let notes = storage.notes()?;
    let note = notes
        .iter()
        .find(|item| item.id == request.note_id)
        .ok_or_else(|| AppError::NotFound(format!("note {}", request.note_id)))?;
    let markdown = storage.read_note_content(&note.id).unwrap_or_default();
    Ok(to_detail(note, markdown))
}

pub fn search_notes(
    storage: &FileStorage,
    request: NoteSearchRequest,
) -> AppResult<NoteSearchResponse> {
    let query = request
        .query
        .or(request.keyword)
        .unwrap_or_default()
        .trim()
        .to_lowercase();
    let limit = request.limit.unwrap_or(20).clamp(1, 100);

    let mut items = Vec::new();
    for note in storage.notes()? {
        let content = storage.read_note_content(&note.id).unwrap_or_default();
        let title_matches = note.title.to_lowercase().contains(&query);
        let content_matches = query.is_empty() || content.to_lowercase().contains(&query);

        if title_matches || content_matches {
            items.push(NoteSearchItem {
                note,
                excerpt: excerpt_for(&content, &query),
            });
        }

        if items.len() >= limit {
            break;
        }
    }

    let total = items.len();
    Ok(NoteSearchResponse { items, total })
}

fn normalized_title(title: &str) -> AppResult<String> {
    let title = title.trim();
    if title.is_empty() {
        return Err(AppError::InvalidInput("title is required".to_string()));
    }
    Ok(title.to_string())
}

pub fn to_detail(note: &NoteRecord, markdown: String) -> NoteDetailResponse {
    NoteDetailResponse {
        id: note.id.clone(),
        title: note.title.clone(),
        folder_id: "articles".to_string(),
        path: note.markdown_path.clone(),
        excerpt: excerpt_for(&markdown, ""),
        icon: "📄".to_string(),
        pinned: false,
        updated_at: note.updated_at,
        word_count: markdown.chars().filter(|value| !value.is_whitespace()).count(),
        tags: Vec::new(),
        markdown,
    }
}

fn excerpt_for(content: &str, query: &str) -> String {
    let matched_line = content
        .lines()
        .find(|line| line.to_lowercase().contains(query))
        .unwrap_or_else(|| content.lines().next().unwrap_or(""));

    matched_line.chars().take(240).collect()
}
