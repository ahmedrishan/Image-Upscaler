# Offline AI Upscaler

A full-stack, offline-capable AI image upscaler using RealESRGAN, FastAPI, and React.

## 🚀 Quick Start

**Method 1: One-Click Script (Windows)**
Double-click `start_app.bat` in this folder.
- It opens two terminal windows (one for backend, one for frontend).
- Open your browser to `http://localhost:5173`.

**Method 2: Manual Start**

**1. Backend Terminal:**
```powershell
cd Backend_Upscaler
.\venv\Scripts\Activate.ps1
uvicorn server:app --reload
```

**2. Frontend Terminal:**
```powershell
cd Frontend_Upscaler
npm run dev
```

## 🛠 Features
- **Offline**: No cloud dependencies.
- **4x Upscale**: Uses RealESRGAN x4plus model.
- **Auto-Device**: Uses GPU (CUDA) if available, otherwise CPU.

## ⚠️ Troubleshooting
See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues like "Backend Offline" or dependency errors.
