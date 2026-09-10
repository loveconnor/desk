"""Generate bounded-memory images after editing originals. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1] / 'public'


def resize(source, destination, size):
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        if destination.suffix.lower() in {'.jpg', '.jpeg'}:
            image.convert('RGB').save(destination, quality=75, optimize=True)
        else:
            image.save(destination, optimize=True)


for source in sorted((root / 'room/books').iterdir()):
    if source.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
        resize(source, root / 'room/books/mobile' / source.name, 1536)
resize(root / 'macos/wallpaper.jpg', root / 'macos/wallpaper-desktop.jpg', 2560)
resize(root / 'macos/wallpaper.jpg', root / 'macos/wallpaper-mobile.jpg', 1024)
