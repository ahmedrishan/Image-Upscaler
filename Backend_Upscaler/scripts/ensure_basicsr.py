import os
import sys
import site
import subprocess
import tarfile
import shutil

def install_basicsr_from_source():
    """Downloads and installs basicsr from source with patched setup.py."""
    print(f"Using python: {sys.executable}")
    
    # 1. Download source
    print("Downloading basicsr 1.4.2 source...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "download", "basicsr==1.4.2", "--no-deps", "--no-binary", ":all:", "--no-build-isolation", "-d", "."])
    except subprocess.CalledProcessError:
        print("Failed to download basicsr. Check internet connection.")
        return False

    # Find the tar.gz
    try:
        tar_file = [f for f in os.listdir(".") if f.startswith("basicsr-") and f.endswith(".tar.gz")][0]
    except IndexError:
        print("Could not find downloaded tar.gz file.")
        return False
    
    # 2. Extract
    print(f"Extracting {tar_file}...")
    try:
        with tarfile.open(tar_file, "r:gz") as tar:
            tar.extractall(".")
    except Exception as e:
        print(f"Extraction failed: {e}")
        return False
    
    dir_name = tar_file.replace(".tar.gz", "")
    
    if not os.path.exists(dir_name):
        possible_dirs = [d for d in os.listdir(".") if os.path.isdir(d) and d.startswith("basicsr")]
        if possible_dirs:
            dir_name = possible_dirs[0]
        else:
            print("Could not find extracted directory.")
            return False

    # 3. Patch setup.py
    setup_path = os.path.join(dir_name, "setup.py")
    print(f"Patching {setup_path}...")
    
    if os.path.exists(setup_path):
        with open(setup_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Patch the specific failure point: locals()['__version__']
        new_content = content.replace("return locals()['__version__']", "return '1.4.2'")
        
        with open(setup_path, "w", encoding="utf-8") as f:
            f.write(new_content)
    else:
        print("setup.py not found, skipping patch (strange).")
        
    # 4. Install
    print("Installing patched basicsr...")
    success = False
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", os.path.abspath(dir_name), "--no-build-isolation"])
        print("Successfully installed basicsr!")
        success = True
    except subprocess.CalledProcessError:
        print("Failed to install patched basicsr.")
    
    # 5. Cleanup
    print("Cleaning up temporary files...")
    try:
        if os.path.exists(tar_file):
            os.remove(tar_file)
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
    except Exception as e:
        print(f"Cleanup warning: {e}")
        
    return success

def find_degradations_file():
    """Locates the degradations.py file in site-packages."""
    
    # Method 1: Try importing if installed
    try:
        import basicsr
        basicsr_path = os.path.dirname(basicsr.__file__)
        candidate = os.path.join(basicsr_path, "data", "degradations.py")
        if os.path.exists(candidate):
            return candidate
    except ImportError:
        pass

    # Method 2: Search site-packages
    paths = list(sys.path)
    paths.extend(site.getsitepackages())
    
    for path in paths:
        if not path or not os.path.exists(path):
            continue
        candidate = os.path.join(path, "basicsr", "data", "degradations.py")
        if os.path.exists(candidate):
            return candidate
            
    # Method 3: Relative path fallback (if running from venv)
    candidates = [
        os.path.join("venv", "Lib", "site-packages", "basicsr", "data", "degradations.py"),
        os.path.join("..", "venv", "Lib", "site-packages", "basicsr", "data", "degradations.py")
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)
            
    return None

def patch_degradations_file(target_file):
    """Patches the degradations.py file for torchvision compatibility."""
    print(f"Patching {target_file}...")
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        old_import = "from torchvision.transforms.functional_tensor import rgb_to_grayscale"
        new_import = "from torchvision.transforms.functional import rgb_to_grayscale"
        
        if old_import not in content and new_import in content:
            print("File is already patched!")
            return True

        if old_import in content:
            new_content = content.replace(old_import, new_import)
            with open(target_file, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("SUCCESS: Patch applied to degradations.py.")
            return True
        else:
            print("WARNING: Could not find the specific import string. File might differ from expected version or be already patched in a different way.")
            return False
            
    except Exception as e:
        print(f"Failed to write patch: {e}")
        return False

def ensure_basicsr():
    print("=== Checking basicsr Installation & Compatibility ===")
    
    # 1. Check if basicsr is importable
    try:
        import basicsr
        print("basicsr is importable.")
    except ImportError:
        print("basicsr is NOT installed. Attempting installation from source...")
        if not install_basicsr_from_source():
            print("CRITICAL ERROR: Failed to install basicsr. Aborting.")
            sys.exit(1)

    # 2. Patch degradations.py
    target_file = find_degradations_file()
    if target_file:
        patch_degradations_file(target_file)
    else:
        print("ERROR: basicsr seems installed but could not locate data/degradations.py to patch.")
        sys.exit(1)

if __name__ == "__main__":
    ensure_basicsr()
