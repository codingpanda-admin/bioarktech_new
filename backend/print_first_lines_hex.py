path = r"F:\bioarktech\backend\bioarktech.sql"
with open(path, "rb") as f:
    data = f.read(500)

print("Hex bytes:")
print(data.hex())
print("\nText representation:")
try:
    print(data.decode('utf-8'))
except Exception as e:
    print("UTF-8 decode failed:", e)

try:
    print(data.decode('utf-16-le'))
except Exception as e:
    print("UTF-16-LE decode failed:", e)
