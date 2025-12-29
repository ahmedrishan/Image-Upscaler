# Installation Guide (Python 3.11)

Since you are using Python 3.11, we can use standard pre-built wheels for most packages.

### 1. Setup Virtual Environment
(You may have already done this)
```powershell
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install Build Essentials
We need to pin `setuptools` first because `basicsr` has a known issue with newer versions.
```powershell
pip install "setuptools<70" wheel Cython
```

### 3. Install PyTorch (Choose One)

**Option A: CUDA 12.1 (Best for NVIDIA GPU)**
```powershell
pip install torch==2.3.1+cu121 torchvision==0.18.1+cu121 torchaudio==2.3.1+cu121 --index-url https://download.pytorch.org/whl/cu121
```

**Option B: CUDA 11.8 (Older NVIDIA GPU)**
```powershell
pip install torch==2.3.1+cu118 torchvision==0.18.1+cu118 torchaudio==2.3.1+cu118 --index-url https://download.pytorch.org/whl/cu118
```

**Option C: CPU Only (No GPU)**
```powershell
pip install torch==2.3.1+cpu torchvision==0.18.1+cpu torchaudio==2.3.1+cpu --index-url https://download.pytorch.org/whl/cpu
```

### 4. Install Remaining Keys
Now install the rest of the project requirements.
```powershell
pip install -r requirements.txt
```

### 5. Verify & Run
Create a file `test_install.py`:
```python
import torch
import realesrgan
print(f"Torch: {torch.__version__}, CUDA: {torch.cuda.is_available()}")
print("RealESRGAN imported successfully.")
```

Run it:
```powershell
python test_install.py
```

Start Server:
```powershell
uvicorn server:app --reload
```
