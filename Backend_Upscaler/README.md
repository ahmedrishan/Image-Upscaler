# AI Upscaler Backend

A high-performance image upscaling REST API built with **FastAPI** and **Real-ESRGAN**. 

This Service handles file uploads, processes images using the Real-ESRGAN x4plus model (PyTorch), and serves the upscaled results. It is designed to work offline with a React frontend.

## 🚀 Features
- **FastAPI Server**: High-performance async Python web server.
- **Real-ESRGAN x4**: State-of-the-art AI upscaling (4x magnification).
- **GPU Acceleration**: Optimized for NVIDIA CUDA (falls back to CPU if needed).
- **Auto-Cleaning**: Manages `uploads/` and `outputs/` directories.

## 📋 Prerequisites
- **Python 3.11.x** (Strict requirement for dependency compatibility)
- **NVIDIA GPU** (Recommended for speed, requires CUDA 11.8 or 12.1)

## 🛠️ Installation

> **Note:** For a detailed, step-by-step guide specific to Python 3.11, see [INSTALL_PY311.md](INSTALL_PY311.md).

### 1. Setup Virtual Environment
```powershell
# Create virtual environment
py -3.11 -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
**Important:** We must install packages in a specific order to avoid build errors with `basicsr`.

1. **Install Build Tools:**
   ```powershell
   pip install "setuptools<70" wheel Cython
   ```

2. **Install PyTorch:**
   *For CUDA 12.1 (Recommended):*
   ```powershell
   pip install torch==2.3.1+cu121 torchvision==0.18.1+cu121 torchaudio==2.3.1+cu121 --index-url https://download.pytorch.org/whl/cu121
   ```
   *(See INSTALL_PY311.md for other CUDA versions or CPU-only)*

3. **Install Project Requirements:**
   ```powershell
   pip install -r requirements.txt
   ```

### 3. Critical Fix (Basicsr)
The `basicsr` library has a known compatibility issue with newer PyTorch versions. You must manually patch a file if you see a `ModuleNotFoundError` for `functional_tensor`.

**File:** `venv/Lib/site-packages/basicsr/data/degradations.py`  
**Change Line 8:**
```python
# Change this:
from torchvision.transforms.functional_tensor import rgb_to_grayscale
# To this:
from torchvision.transforms.functional import rgb_to_grayscale
```

## ⚡ Running the Server

Start the API server with hot-reload enabled:

```powershell
uvicorn server:app --reload
```
The server will start at `http://127.0.0.1:8000`.

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Check API status and active device (CUDA/CPU). |
| `POST` | `/upload` | Upload an image. Returns the file path. |
| `POST` | `/upscale` | Trigger upscaling for an uploaded file. |
| `GET` | `/download/{filename}` | Download the processed image. |

## 📂 Project Structure
- `server.py`: Main FastAPI application entry point.
- `upscaler.py`: Core logic wrapper for RealESRGAN.
- `weights/`: Stores the AI model files (e.g., `RealESRGAN_x4plus.pth`).
- `uploads/`: Temporary storage for raw inputs.
- `outputs/`: Storage for upscaled results.