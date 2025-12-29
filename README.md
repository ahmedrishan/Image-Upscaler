# Offline AI Image Upscaler

A professional Windows desktop application that uses **RealESRGAN** for local image enhancement. It features a robust **FastAPI** backend and a modern **React/Vite** frontend, ensuring all processing stays offline for maximum privacy.

## ✨ Core Features

*   **High-Quality Upscaling**: Powered by the state-of-the-art RealESRGAN model to enhance image resolution and detail.
*   **Modern UI**: Built with React and Tailwind CSS for a sleek, responsive, and user-friendly experience.
*   **Privacy First**: 100% offline processing. No images are ever uploaded to the cloud; your data stays on your machine.
*   **Simple Launch**: A single `.bat` file to start both backend and frontend services instantly.

## 📂 Project Structure

*   **`Backend_Upscaler/`**: Contains the FastAPI server, AI model logic, and python environments.
*   **`Frontend_Upscaler/`**: Contains the React/Vite source code and UI assets.
*   **`start_app.bat`**: The main entry point for Windows users to launch the application.

## 🚀 Installation & Usage

### Prerequisites
*   **Python 3.11** (Required for the backend environment)
*   **Node.js** (Required for the frontend environment)

### How to Run
1.  Double-click **`start_app.bat`** in the root directory.
2.  Two terminal windows will open (one for the backend, one for the frontend).
3.  The application will automatically launch in your default browser (usually at `http://localhost:5173`).

## 📁 Data Directories

*   **`Backend_Upscaler/uploads/`**: Stores images temporarily uploaded for processing.
*   **`Backend_Upscaler/outputs/`**: Contains the final upscaled images.
