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

pub struct AppState {
    pub files: Mutex<Vec<FileEntry>>,
}

fn format_date(dt: DateTime<Utc>) -> String {
    dt.format("%Y%m%d").to_string()
}

fn generate_new_name(file: &FileEntry, index: usize, total_files: usize, prefix: &str) -> String {
    let tags_part = if file.tags.is_empty() {
        "NOTAGS".to_string()
    } else {
        file.tags.join("-")
    };
    let date_part = format_date(file.date);
    let inc = if total_files > 1 {
        format!("_{}", index + 1)
    } else {
        "".to_string()
    };
    let suffix_part = if !file.suffix.is_empty() {
        format!("_{}", file.suffix)
    } else {
        "".to_string()
    };
    format!("{}_{}_{}{}{}", prefix, tags_part, date_part, inc, suffix_part)
}

fn update_all_new_names(files: &mut Vec<FileEntry>, prefix: &str) {
    let total_files = files.len();
    for (index, file) in files.iter_mut().enumerate() {
        file.new_name = generate_new_name(file, index, total_files, prefix);
    }
}

#[tauri::command]
pub fn import_files_from_dialog(paths: Vec<String>, recursive: bool, state: State<AppState>) -> Vec<FileEntry> {
    let mut file_entries = vec![];
    let mut all_paths = vec![];

    for path in paths {
        if Path::new(&path).is_dir() {
            let walker = WalkDir::new(&path).into_iter();
            if !recursive {
                walker.max_depth(1);
            }
            for entry in walker.filter_map(Result::ok) {
                if entry.file_type().is_file() {
                    all_paths.push(entry.path().to_str().unwrap().to_string());
                }
            }
        } else {
            all_paths.push(path);
        }
    }

    for path in all_paths {
        let id = Uuid::new_v4().to_string();
        let metadata = fs::metadata(&path).unwrap();
        let date = metadata.modified().unwrap().into();
        let file_entry = FileEntry {
            id,
            old_name: Path::new(&path).file_name().unwrap().to_str().unwrap().to_string(),
            new_name: "".to_string(),
            path,
            date,
            tags: vec![],
            suffix: "".to_string(),
        };
        file_entries.push(file_entry);
    }
    update_all_new_names(&mut file_entries, "C");
    *state.files.lock().unwrap() = file_entries.clone();
    file_entries
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
    let mut files = state.files.lock().unwrap();
    let new_prefix = if prefix.is_empty() { "C" } else { &prefix };
    update_all_new_names(&mut files, new_prefix);
    files.clone()
}

#[tauri::command]
pub fn update_file(file_id: String, new_file: FileEntry, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        *file = new_file;
    }
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn toggle_tag(file_ids: Vec<String>, tag: String, state: State<AppState>) -> Vec<FileEntry> {
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
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn update_tags(file_id: String, tags: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.tags = tags;
    }
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn update_date(file_id: String, date: DateTime<Utc>, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.date = date;
    }
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn update_suffix(file_id: String, suffix: String, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    if let Some(file) = files.iter_mut().find(|f| f.id == file_id) {
        file.suffix = suffix;
    }
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn remove_files(file_ids: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    let file_ids_set: HashSet<_> = file_ids.into_iter().collect();
    files.retain(|f| !file_ids_set.contains(&f.id));
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn clear_all(state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    files.clear();
    files.clone()
}

#[tauri::command]
pub fn clear_suffix(file_ids: Vec<String>, state: State<AppState>) -> Vec<FileEntry> {
    let mut files = state.files.lock().unwrap();
    let file_ids_set: HashSet<_> = file_ids.into_iter().collect();
    for file in files.iter_mut().filter(|f| file_ids_set.contains(&f.id)) {
        file.suffix = "".to_string();
    }
    update_all_new_names(&mut files, "C");
    files.clone()
}

#[tauri::command]
pub fn rename_files(files_to_rename: Vec<FileEntry>, state: State<AppState>) -> RenameResult {
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = vec![];

    for file in files_to_rename {
        let old_path = Path::new(&file.path);
        let new_name = format!(
            "{}.{}",
            file.new_name,
            old_path.extension().unwrap().to_str().unwrap()
        );
        let new_path = old_path.with_file_name(new_name);

        if let Err(e) = fs::rename(&old_path, &new_path) {
            error_count += 1;
            errors.push(RenameError {
                file: file.old_name,
                error: e.to_string(),
            });
        } else {
            success_count += 1;
        }
    }

    if error_count == 0 {
        let mut files = state.files.lock().unwrap();
        files.clear();
    }

    RenameResult {
        success_count,
        error_count,
        errors,
    }
}

#[tauri::command]
pub fn undo_rename(rename_history: Vec<RenameHistoryEntry>) -> RenameResult {
    let mut success_count = 0;
    let mut error_count = 0;
    let mut errors = vec![];

    for entry in rename_history {
        if let Err(e) = fs::rename(&entry.new_path, &entry.old_path) {
            error_count += 1;
            errors.push(RenameError {
                file: entry.new_path,
                error: e.to_string(),
            });
        } else {
            success_count += 1;
        }
    }

    RenameResult {
        success_count,
        error_count,
        errors,
    }
}
