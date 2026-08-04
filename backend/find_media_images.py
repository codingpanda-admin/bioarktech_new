import os

files_to_find = [
    "be750c48-4a70-49ee-8a08-197239a7650f.jpg",
    "a38f62d2-774d-41fd-885e-ef93a6d79cec.webp"
]

search_dirs = ["/var/www/django/media", "/app"]

for filename in files_to_find:
    found = False
    for sdir in search_dirs:
        if os.path.exists(sdir):
            for root, dirs, files in os.walk(sdir):
                if filename in files:
                    path = os.path.join(root, filename)
                    print(f"Found inside container: '{filename}' at path: '{path}'")
                    found = True
    if not found:
        print(f"Not found in container: '{filename}'")
