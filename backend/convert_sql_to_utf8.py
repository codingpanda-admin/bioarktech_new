import os

path = r"F:\bioarktech\backend\bioarktech.sql"

# Try reading as UTF-16 (which auto-detects BOM/endianness)
try:
    with open(path, "rb") as f:
        raw = f.read(100)
    print("First 100 bytes:", raw)
    
    # Try UTF-16 decoding
    with open(path, "r", encoding="utf-16") as f:
        content = f.read()
    print("Successfully read as UTF-16")
except Exception as e:
    print("Failed to read as UTF-16:", e)
    # Try reading as UTF-16-LE directly
    try:
        with open(path, "r", encoding="utf-16-le") as f:
            content = f.read()
        print("Successfully read as UTF-16-LE")
    except Exception as e2:
        print("Failed to read as UTF-16-LE:", e2)
        content = None

if content:
    # Write back as standard UTF-8 (without BOM)
    # We must preserve the content exactly
    backup_path = path + ".bak"
    if os.path.exists(backup_path):
        os.remove(backup_path)
    os.rename(path, backup_path)
    
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Successfully converted {path} to UTF-8! (Backup saved to {backup_path})")
else:
    print("Could not decode the file!")
