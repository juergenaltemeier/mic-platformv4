use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use chrono::{DateTime, Utc};
use tauri::State;
use uuid::Uuid;
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub id: String,
    pub old_name: String,
    pub new_name: String,
    pub path: String,
    pub asset_url: String,
    pub date: DateTime<Utc>,
    pub tags: Vec<String>,
    pub suffix: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenameResult {
    pub success_count: u32,
    pub error_count: u32,
    pub errors: Vec<RenameError>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenameError {
    pub file: String,
    pub error: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenameHistoryEntry {
    pub old_path: String,
    pub new_path: String,
}

use log::{info, warn, error};

fn format_date(date: &DateTime<Utc>) -> String {
    date.format("%Y-%m-%d").to_string()
}

fn generate_new_name(file: &FileEntry, index: usize, total_files: usize, prefix: &str) -> String {
    let formatted_date = format_date(&file.date);
    let num_digits = total_files.to_string().len();
    let sequence = format!("{:0width$}", index + 1, width = num_digits);
    
    let mut tags_part = file.tags.join("_");
    if !tags_part.is_empty() {
        tags_part.insert(0, '_');
    }

    let mut suffix_part = file.suffix.clone();
    if !suffix_part.is_empty() {
        suffix_part.insert(0, '_');
    }

    format!(
        "{}_{}_{}{}{}",
        prefix, formatted_date, sequence, tags_part, suffix_part
    )
}

pub struct AppState {
    pub files: Mutex<Vec<FileEntry>>,
    pub prefix: Mutex<String>,
}

fn update_all_new_names(files: &mut Vec<FileEntry>, prefix: &str) {
    let total_files = files.len();
    for (index, file) in files.iter_mut().enumerate() {
        file.new_name = generate_new_name(file, index, total_files, prefix);
    }
}

use tauri::Url;

#[tauri::command]
pub fn import_files_from_dialog(paths: Vec<String>, recursive: bool, _app: tauri::AppHandle, state: State<AppState>) -> Vec<FileEntry> {
    info!("Importing files from dialog. Recursive: {}", recursive);
    let mut file_entries = vec![];
    let mut all_paths = vec![];

    for path in paths {
        let path_obj = Path::new(&path);
        if path_obj.is_dir() {
            let mut walker_builder = WalkDir::new(&path);
            if !recursive {
                walker_builder = walker_builder.max_depth(1);
            }
            for entry in walker_builder.into_iter().filter_map(Result::ok) {
                if entry.file_type().is_file() {
                    if let Some(path_str) = entry.path().to_str() {
                        all_paths.push(path_str.to_string());
                    } else {
                        warn!("Skipping path with invalid UTF-8: {:?}", entry.path());
                    }
                }
            }
        } else {
            all_paths.push(path);
        }
    }
    info!("Found {} files to import.", all_paths.len());

    for path in all_paths {
        let id = Uuid::new_v4().to_string();
        match fs::metadata(&path) {
            Ok(metadata) => {
                let date = metadata.modified().map(Into::into).unwrap_or_else(|_| Utc::now());
                let file_name = Path::new(&path)
                    .file_name()
                    .and_then(|s| s.to_str())
                    .unwrap_or("invalid_filename")
                    .to_string();
                
                let asset_url = Url::from_file_path(&path).unwrap().to_string();

                let file_entry = FileEntry {
                    id,
                    old_name: file_name,
                    new_name: "".to_string(),
                    path,
                    asset_url,
                    date,
                    tags: vec![],
                    suffix: "".to_string(),
                };
                file_entries.push(file_entry);
            }
            Err(e) => {
                error!("Failed to get metadata for path {}: {}", path, e);
            }
        }
    }

    let prefix = state.prefix.lock().unwrap().clone();
    update_all_new_names(&mut file_entries, &prefix);
    
    let mut files_state = state.files.lock().unwrap();
    *files_state = file_entries.clone();
    
    info!("Import complete. {} files loaded.", files_state.len());
    files_state.clone()
}

#[tauri::command]
pub fn filter_files(filter: String, state: State<AppState>) -> Vec<FileEntry> {
    let files = state.files.lock().unwrap();
    if filter.is_empty() {
        return files.clone();
    }
    let lowercased_filter = filter.to_lowercase();
    files
        .iter()
        .filter(|file| file.old_name.to_lowercase().contains(&lowercased_filter))
        .cloned()
        .collect()
}

#[tauri::command]
pub fn update_prefix(prefix: String, state: State<AppState>) -> Vec<FileEntry> {
    info!("Updating prefix to: {}", prefix);
    let mut files = state.files.lock().unwrap();
    let mut stored_prefix = state.prefix.lock().unwrap();
    *stored_prefix = prefix.clone();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn toggle_tag(file_ids: Vec<String>, tag: String, state: State<AppState>) -> Vec<FileEntry> {
    info!("Toggling tag '{}' for {} files", tag, file_ids.len());
    let mut files = state.files.lock().unwrap();
    let file_ids_set: HashSet<_> = file_ids.into_iter().collect();

    let is_selected_in_all = files
        .iter()
        .filter(|f| file_ids_set.contains(&f.id))
        .all(|f| f.tags.contains(&tag));

    for file in files.iter_mut().filter(|f| file_ids_set.contains(&f.id)) {
        if is_selected_in_all {
            file.tags.retain(|t| t != &tag);
        } else {
            if !file.tags.contains(&tag) {
                file.tags.push(tag.clone());
            }
        }
    }
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn update_tags(file_id: String, tags: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    info!("Updating tags for file: {}", file_id);
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.tags = tags;
    }
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn update_date(file_id: String, date: DateTime<Utc>, state: State<AppState>) -> Vec<FileEntry> {
    info!("Updating date for file: {}", file_id);
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.date = date;
    }
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn update_suffix(file_id: String, suffix: String, state: State<AppState>) -> Vec<FileEntry> {
    info!("Updating suffix for file: {}", file_id);
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.suffix = suffix;
    }
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn remove_files(file_ids: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    info!("Removing {} files", file_ids.len());
    let mut files = state.files.lock().unwrap();
    let file_ids_set: HashSet<_> = file_ids.into_iter().collect();
    files.retain(|f| !file_ids_set.contains(&f.id));
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn clear_all(state: State<AppState>) -> Vec<FileEntry> {
    info!("Clearing all files");
    let mut files = state.files.lock().unwrap();
    files.clear();
    files.clone()
}

#[tauri::command]
pub fn clear_suffix(file_ids: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    info!("Clearing suffix for {} files", file_ids.len());
    let mut files = state.files.lock().unwrap();
    let file_ids_set: HashSet<_> = file_ids.into_iter().collect();
    for file in files.iter_mut().filter(|f| file_ids_set.contains(&f.id)) {
        file.suffix = "".to_string();
    }
    let prefix = state.prefix.lock().unwrap();
    update_all_new_names(&mut files, &prefix);
    files.clone()
}

#[tauri::command]
pub fn rename_files(files_to_rename: Vec<FileEntry>, state: State<AppState>) -> RenameResult {
    info!("Starting rename process for {} files.", files_to_rename.len());
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = vec![];

    for file in &files_to_rename {
        let old_path = Path::new(&file.path);
        let extension = old_path.extension().and_then(|s| s.to_str());

        if let Some(ext) = extension {
            let new_name_with_ext = format!("{}.{}", file.new_name, ext);
            let new_path = old_path.with_file_name(&new_name_with_ext);
            
            info!("Renaming '{}' -> '{}'", file.path, new_path.display());

            if let Err(e) = fs::rename(&old_path, &new_path) {
                error!("Failed to rename {}: {}", old_path.display(), e);
                error_count += 1;
                errors.push(RenameError {
                    file: file.old_name.clone(),
                    error: e.to_string(),
                });
            } else {
                success_count += 1;
            }
        } else {
            error!("Could not get extension for file: {}", file.path);
            error_count += 1;
            errors.push(RenameError {
                file: file.old_name.clone(),
                error: "File has no extension.".to_string(),
            });
        }
    }

    if error_count == 0 {
        info!("All files renamed successfully. Clearing state.");
        let mut files = state.files.lock().unwrap();
        files.clear();
    } else {
        warn!("Rename process finished with {} errors.", error_count);
    }

    RenameResult {
        success_count,
        error_count,
        errors,
    }
}

#[tauri::command]
pub fn undo_rename(rename_history: Vec<RenameHistoryEntry>) -> RenameResult {
    info!("Starting undo process for {} files.", rename_history.len());
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = vec![];

    for entry in rename_history {
        info!("Undoing rename: '{}' -> '{}'", entry.new_path, entry.old_path);
        if let Err(e) = fs::rename(&entry.new_path, &entry.old_path) {
            error!("Failed to undo rename for {}: {}", entry.new_path, e);
            error_count += 1;
            errors.push(RenameError {
                file: entry.new_path,
                error: e.to_string(),
            });
        } else {
            success_count += 1;
        }
    }
    info!("Undo process complete. Success: {}, Errors: {}", success_count, error_count);
    RenameResult {
        success_count,
        error_count,
        errors,
    }
}
