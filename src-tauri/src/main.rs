// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use tauri::Manager;
#[cfg(target_os = "linux")]
use std::{fs::metadata, path::PathBuf};
use std::path::PathBuf;
use std::process::Command;
#[cfg(target_os = "linux")]
use fork::{daemon, Fork}; // dep: fork = "0.1"

fn main() {
    // prepare() checks if it's a single instance and tries to send the args otherwise.
    // It should always be the first line in your main function (with the exception of loggers or similar)
    tauri_plugin_deep_link::prepare("com.jam54.Takma");
    // It's expected to use the identifier from tauri.conf.json
    // Unfortuenetly getting it is pretty ugly without access to sth that implements `Manager`.

    tauri::Builder::default()
         .setup(|app| {
             // If you need macOS support this must be called in .setup() !
             // Otherwise this could be called right after prepare() but then you don't have access to tauri APIs
             let handle = app.handle();
             tauri_plugin_deep_link::register(
                 "takma",
                 move |request| {
                     dbg!(&request);
                     handle.emit_all("deep-link-received", request).unwrap();
                },
             )
             .unwrap(/* If listening to the scheme is optional for your app, you don't want to unwrap here. */);

             // If you also need the url when the primary instance was started by the custom scheme, you currently have to read it yourself
             /*
             #[cfg(not(target_os = "macos"))] // on macos the plugin handles this (macos doesn't use cli args for the url)
             if let Some(url) = std::env::args().nth(1) {
               app.emit_all("scheme-request-received", url).unwrap();
             }
             */
             Ok(())
        })
        // .plugin(tauri_plugin_deep_link::init()) // consider adding a js api later
        .invoke_handler(tauri::generate_handler![show_in_folder])
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn show_in_folder(path: String) {
  #[cfg(target_os = "windows")]
  {
    Command::new("explorer")
        .args(["/select,", &path]) // The comma after select is not a typo
        .spawn()
        .unwrap();
  }

  #[cfg(target_os = "linux")]
  {
    if path.contains(",") {
      // see https://gitlab.freedesktop.org/dbus/dbus/-/issues/76
      let new_path = match metadata(&path).unwrap().is_dir() {
        true => path,
        false => {
          let mut path2 = PathBuf::from(path);
          path2.pop();
          path2.into_os_string().into_string().unwrap()
        }
      };
      Command::new("xdg-open")
          .arg(&new_path)
          .spawn()
          .unwrap();
    } else {
      if let Ok(Fork::Child) = daemon(false, false) {
        Command::new("dbus-send")
            .args(["--session", "--dest=org.freedesktop.FileManager1", "--type=method_call",
                  "/org/freedesktop/FileManager1", "org.freedesktop.FileManager1.ShowItems",
                  format!("array:string:\"file://{path}\"").as_str(), "string:\"\""])
            .spawn()
            .unwrap();
      }
    }
  }

  #[cfg(target_os = "macos")]
  {
    Command::new("open")
        .args(["-R", &path])
        .spawn()
        .unwrap();
  }
}