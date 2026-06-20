import json

path_images = "/app/images.json"
with open(path_images, "r", encoding="utf-8") as f:
    data = json.load(f)

images = data.get("images", [])

prefixes = ["CT-", "FPG", "LNS", "FBS", "QPS", "QPX", "TAP", "TTX", "KOD", "TRT", "SCX", "QRH", "QRX", "TRN", "RIN"]

found = []
for img in images:
    fn = (img.get("fileName") or "").upper()
    alt = (img.get("altText") or "").upper()
    orig = (img.get("variants", {}).get("original") or "").upper()
    
    matched_prefixes = []
    for pref in prefixes:
        if pref in fn or pref in alt or pref in orig:
            matched_prefixes.append(pref)
            
    if matched_prefixes:
        found.append((img.get("fileName"), img.get("variants", {}).get("original"), img.get("altText"), matched_prefixes))

print(f"Total matching images: {len(found)}")
for fn, orig, alt, prefs in found:
    print(f"Prefs: {prefs} | Name: {fn} | File: {orig} | Alt: {alt}")
