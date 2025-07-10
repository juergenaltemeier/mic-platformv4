# Mic Platform v4

This is a new version of the Mic Platform, rebuilt with Tauri 2.0, React, and TypeScript.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js and npm:** [https://nodejs.org/](https://nodejs.org/)
*   **Rust:** Tauri is built with Rust. Install it from [https://www.rust-lang.org/learn/get-started](https://www.rust-lang.org/learn/get-started)
*   **OS-specific dependencies:** Follow the instructions for your operating system here: [https://tauri.app/start/prerequisites/](https://tauri.app/start/prerequisites/)

## Development

1.  **Navigate to the app directory:**
    ```bash
    cd app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the app in development mode:**
    ```bash
    npm run tauri dev
    ```

## Building the Application

1.  **Navigate to the app directory:**
    ```bash
    cd app
    ```

2.  **Build the application:**
    ```bash
    npm run tauri build
    ```

The executable will be located in `app/src-tauri/target/release/`.
