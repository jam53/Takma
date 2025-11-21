// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use tauri_plugin_deep_link::DeepLinkExt;

#[derive(Default)]
struct PendingDeepLink(Mutex<Option<String>>);

impl PendingDeepLink {
    fn set(&self, link: String) {
        *self.0.lock().expect("pending deep link poisoned") = Some(link);
    }

    fn take(&self) -> Option<String> {
        self.0.lock().expect("pending deep link poisoned").take()
    }
}

fn main() {
    let mut builder = tauri::Builder::default()
        .manage(PendingDeepLink::default())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
          // On Linux and Windows deep links are delivered as a command line argument to a new app process.
          // Check if there is more than one argument (the first one is the executable path), which if it is the case, could be a possible deep link.
          // Do note when defining deep link schemes at runtime, you must also check `argv` rather than directly emitting it as a deep link event. As the user could trigger a fake deep link manually by passing an arbitrary string as an argument.
          // In our case the checking is being handled on the JavaScript side (the frontend).
          if argv.len() > 1 {
              // Emit the deep link event only if there's a second argument
              println!("A new app instance was opened with {argv:?}. A `deep-link-received` event was emitted with the payload {:?} to the frontend. The newly opened app instance was closed, as Takma only allows a single active instance.", argv[1]);
              focus_main_window(app.clone());
              app.emit("deep-link-received", &argv[1]).unwrap();
          } else {
              println!("A new app instance was opened by the user, this instance was closed as Takma only allows a single instance to be running at a given time.");
          }
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .setup(|app| {
            #[cfg(desktop)]
            {
                app.deep_link().register("takma")?;
                capture_startup_deep_link(&app.handle());
            }
            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .max_file_size(1 * 1024 * 1024 /* bytes */)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            move_directory,
            take_pending_deep_link
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn focus_main_window<R: Runtime>(app: AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg(desktop)]
fn capture_startup_deep_link<R: Runtime>(app: &AppHandle<R>) {
    if let Some(link) = std::env::args()
        .skip(1)
        .find(|arg| arg.to_lowercase().starts_with("takma://"))
    {
        app.state::<PendingDeepLink>().set(link);
    }
}

#[tauri::command]
fn move_directory(from: String, to: String) -> Result<(), String> {
    let from_path = Path::new(&from);
    let to_path = Path::new(&to);

    fs::rename(from_path, to_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn take_pending_deep_link(state: State<'_, PendingDeepLink>) -> Option<String> {
    state.take()
}