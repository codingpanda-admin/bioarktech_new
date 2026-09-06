"""Normalize aliases used by imported catalog images without changing their URLs."""

from urllib.parse import unquote, urlsplit


def image_identity(image):
    if isinstance(image, dict):
        image = image.get('image') or image.get('url') or image.get('image_url')
    url = str(image or '').strip()
    if not url:
        return ''
    parsed = urlsplit(url.replace('\\', '/'))
    # External hosts may contain unrelated files with the same filename.
    host = parsed.hostname or ''
    if host and host != 'bioarktech.com' and not host.endswith('.bioarktech.com'):
        return url
    path = unquote(parsed.path).lstrip('/')
    for prefix in ('media/product_images/', 'content-api/uploads/originals/', 'media/'):
        if path.startswith(prefix):
            filename = path[len(prefix):]
            if filename and '/' not in filename:
                return 'catalog-image:' + filename
    return path


def dedupe_product_images(images):
    """Keep the first working source and its metadata for each image."""
    result = []
    seen = set()
    for image in images:
        identity = image_identity(image)
        if identity and identity not in seen:
            result.append(image)
            seen.add(identity)
    return result
