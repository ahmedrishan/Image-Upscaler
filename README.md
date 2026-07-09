# Offline AI Image Upscaler

A local AI image upscaling application built with a **FastAPI + PyTorch + Real-ESRGAN** backend and a **React + Vite + Tailwind CSS** frontend.

The app lets you upload an image, preview it, rotate it if needed, upscale it locally with Real-ESRGAN x4, compare the original and enhanced result, and download the final image. Processing happens on your own machine.

## Features

- Local image upload with drag-and-drop or file picker
- Image preview before processing
- Rotation controls before upscaling
- Real-ESRGAN x4 upscaling
- CUDA GPU acceleration when available, with CPU fallback
- Real tile-based processing percentage
- Before/after comparison slider
- Download button for processed images
- Recent result thumbnails
- Toast notifications for success and error states

## Tech Stack

### Backend

- Python 3.11
- FastAPI
- Uvicorn
- PyTorch
- TorchVision
- Real-ESRGAN
- BasicSR
- RRDBNet
- Pillow
- NumPy
- python-multipart

### Frontend

- React 18
- Vite 5
- Tailwind CSS
- Axios
- JavaScript / JSX
- HTML Canvas for client-side image rotation

## Project Structure

```text
Image-Upscaler/
  start_app.bat
  README.md
  TROUBLESHOOTING.md
  PROJECT_REPORT.md
  Backend_Upscaler/
    server.py
    upscaler.py
    requirements.txt
    INSTALL_PY311.md
    uploads/
    outputs/
    weights/
  Frontend_Upscaler/
    package.json
    vite.config.js
    tailwind.config.js
    src/
      App.jsx
      hooks/useUpscaler.js
      services/api.js
      components/
      utils/
```

## Prerequisites

- Windows
- Python 3.11
- Node.js and npm
- NVIDIA GPU recommended for faster processing
- CUDA-compatible PyTorch build recommended if using GPU acceleration

## Installation

### 1. Backend Setup

From the project root:

```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
pip install "setuptools<70" wheel Cython
pip install -r Backend_Upscaler\requirements.txt
```

For CUDA-specific PyTorch installation commands, see:

```text
Backend_Upscaler/INSTALL_PY311.md
```

### 2. Frontend Setup

```powershell
cd Frontend_Upscaler
npm install
```

## Running the App

The easiest way is to run the Windows launcher from the project root:

```powershell
.\start_app.bat
```

This opens two terminal windows:

- Backend server: `http://127.0.0.1:8000`
- Frontend dev server: `http://localhost:3000`

Open the frontend in your browser:

```text
http://localhost:3000
```

Note: Vite is configured in `Frontend_Upscaler/vite.config.js` to use port `3000`.

## Manual Run Commands

### Backend

```powershell
.\venv\Scripts\Activate.ps1
cd Backend_Upscaler
uvicorn server:app --reload
```

Health check:

```text
http://127.0.0.1:8000/health
```

### Frontend

```powershell
cd Frontend_Upscaler
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Checks backend status and active device. |
| `POST` | `/upload` | Uploads an image into `uploads/`. |
| `POST` | `/upscale` | Runs Real-ESRGAN on an uploaded image. |
| `GET` | `/progress/{filename}` | Returns real tile processing progress. |
| `GET` | `/download/{filename}` | Downloads a processed image. |
| `GET` | `/uploads/{filename}` | Serves the uploaded original image. |

## Real Progress Indicator

The frontend processing indicator is connected to backend tile progress.

During upscaling, the backend reports how many Real-ESRGAN tiles have completed. The frontend polls `/progress/{filename}` and displays a real percentage such as:

```text
Processing... 33%
Processed 5/15 tiles
```

## Data Directories

- `Backend_Upscaler/uploads/`: temporarily stores uploaded original images.
- `Backend_Upscaler/outputs/`: stores final upscaled images.
- `Backend_Upscaler/weights/`: stores model weights such as `RealESRGAN_x4plus.pth`.

## Troubleshooting

### Backend is offline

Open:

```text
http://127.0.0.1:8000/health
```

If it does not respond, restart the backend terminal.

### Frontend cannot connect to backend

Make sure the backend is running on:

```text
http://127.0.0.1:8000
```

The backend CORS list allows both `localhost:3000` and `localhost:5173`.

### GPU out of memory

Reduce the tile size in `Backend_Upscaler/server.py`:

```python
upscaler = RealESRGANUpscaler(tile=128, progress_callback=handle_upscaler_progress)
```

### BasicSR or dependency errors

Use Python 3.11 and keep these dependency constraints:

- `setuptools<70`
- `numpy<2.0.0`

More details are in `Backend_Upscaler/INSTALL_PY311.md` and `TROUBLESHOOTING.md`.

## Report

A detailed technical report is available in:

```text
PROJECT_REPORT.md
```
