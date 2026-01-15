import os
import shutil
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from upscaler import RealESRGANUpscaler

# --- Configurations ---
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://localhost:3000"
]

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- App & Middleware ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Initialization ---
# Initialize usage of RealESRGANUpscaler
# We use a global instance to load model once (which is expensive)
# tile=256 helps avoid OOM on lower-end GPUs
upscaler = RealESRGANUpscaler(tile=256)

# --- Pydantic Models ---
class UpscaleRequest(BaseModel):
    filename: str

# --- Endpoints ---

@app.get("/health")
def health_check():
    """
    Check backend status and device.
    """
    return {
        "status": "ok",
        "device": upscaler.device
    }

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file to the uploads/ directory.
    """
    print(f"DEBUG: Receiving upload for filename='{file.filename}' content_type='{file.content_type}'")

    # Validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate path
    raw_filename = file.filename
    if not raw_filename:
        import uuid
        ext = ".jpg" 
        if file.content_type == "image/png": ext = ".png"
        raw_filename = f"image_{uuid.uuid4()}{ext}"
    
    # Secure filename (basic)
    filename = os.path.basename(raw_filename)
    # Sanitize: replace anything that isn't alphanumeric, dot, underscore, or hyphen with underscore
    filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        print(f"DEBUG: Saved to {file_path}")
    except Exception as e:
        print(f"ERROR: Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    resp = {
        "filename": filename,
        "path": file_path
    }
    print(f"DEBUG: Upload successful. Returning: {resp}")
    return resp

@app.post("/upscale")
def upscale_image(request: UpscaleRequest):
    """
    Upscale an image existing in uploads/.
    Save to outputs/.
    """
    print(f"DEBUG: Upscale requested for filename='{request.filename}'")
    
    if not request.filename or not request.filename.strip():
        print("ERROR: Filename is empty or whitespace")
        raise HTTPException(status_code=400, detail="Filename cannot be empty")

    input_path = os.path.join(UPLOAD_DIR, request.filename)
    
    if not os.path.exists(input_path):
        print(f"ERROR: Input file not found at {input_path}")
        raise HTTPException(status_code=404, detail="File not found")
        
    if os.path.isdir(input_path):
         print(f"ERROR: Path is a directory: {input_path}")
         raise HTTPException(status_code=400, detail="Filename points to a directory")

    output_filename = f"upscaled_{request.filename}"
    output_path = os.path.join(OUTPUT_DIR, output_filename)

    try:
        # synchronous call to model
        print(f"DEBUG: Starting upscale -> {output_path}")
        upscaler.upscale_and_save(input_path, output_path)
        print(f"DEBUG: Upscale finished")
    except Exception as e:
        print(f"ERROR: Upscaling failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(e)}")

    return {
        "output": output_path,
        "scale": upscaler.scale
    }

@app.get("/download/{filename}")
def download_image(filename: str):
    """
    Download an image from the outputs/ directory.
    """
    print(f"DEBUG: Download requested for {filename}")
    file_path = os.path.join(OUTPUT_DIR, filename)
    
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, filename=filename)

@app.get("/uploads/{filename}")
def get_uploaded_image(filename: str):
    """
    Serve an image from the uploads/ directory.
    """
    print(f"DEBUG: Serving upload {filename}")
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        print(f"ERROR: File not found at {file_path}")
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
