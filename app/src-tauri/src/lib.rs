mod renamer;

use renamer::AppState;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState { files: Default::default() })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            renamer::import_files_from_dialog,
            renamer::filter_files,
            renamer::update_prefix,
            renamer::update_file,
            renamer::toggle_tag,
            renamer::update_tags,
            renamer::update_date,
            renamer::update_suffix,
            renamer::remove_files,
            renamer::clear_all,
            renamer::clear_suffix,
            renamer::rename_files,
            renamer::undo_rename
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
