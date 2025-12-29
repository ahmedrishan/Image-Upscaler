# Troubleshooting & Run Guide

## 1. Running the Project

### Backend
1.  Navigate to `Backend_Upscaler`.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the server:
    ```bash
    uvicorn server:app --reload
    ```
    The server will start at `http://127.0.0.1:8000`.

### Frontend
1.  Navigate to `Frontend_Upscaler`.
2.  Install dependencies (if not done):
    ```bash
    npm install
    ```
3.  Start the dev server:
    ```bash
    npm run dev
    ```
    Open the link shown (usually `http://localhost:5173`).

## 2. Common Issues

### Backend Offline
- **Symptom**: Frontend shows "Backend Offline" or "Connecting...".
- **Fix**: Ensure `uvicorn` is running. Check the terminal for errors.
- **Check**: Open `http://127.0.0.1:8000/health` in your browser. It should return `{"status": "ok", ...}`.

### CORS Errors
- **Symptom**: Browser console shows "Access to XMLHttpRequest blocked by CORS policy".
- **Fix**: Open `Backend_Upscaler/server.py` and ensure `ALLOWED_ORIGINS` includes your frontend URL (e.g., `http://127.0.0.1:5173`).

### Upscaling Fails
- **Symptom**: "Upscale failed" toast in UI.
- **Fix**: Check backend terminal logs.
    - **OOM (Out of Memory)**: If on GPU, try reducing `tile=256` to `tile=128` in `server.py`.
    - **Missing Model**: Ensure internet is connected for first run to download weights (referenced in `upscaler.py`).

### File Permissions
- Ensure the backend has write access to create `uploads/` and `outputs/` folders.

### Broken Virtual Environment (Fatal error in launcher)
- **Symptom**: `Fatal error in launcher: Unable to create process using ...`
- **Cause**: Moving or renaming the project folder breaks the virtual environment because paths are hardcoded.
- **Fix**:
    1. Delete the `venv` folder.
    2. Recreate it: `python -m venv venv`
    3. Activate: `.\venv\Scripts\activate`
    4. Re-install: `pip install -r requirements.txt`

### Dependency Installation Failure (basicsr / setuptools)
- **Symptom**: `KeyError: '__version__'` during `pip install`.
- **Cause**: The `basicsr` library (dependency of RealESRGAN) is incompatible with `setuptools` versions 70+.
- **Fix**:
    1. Activate venv: `.\venv\Scripts\Activate.ps1`
    2. Run the patch script: 
       ```bash
       python fix_basicsr.py
       ```
    3. Install remaining requirements:
       ```bash
       pip install -r requirements.txt
       ```
