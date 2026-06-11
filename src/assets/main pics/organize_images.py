from __future__ import annotations

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent
TARGET_SUBFOLDER = "main pic"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".tiff"}


def unique_destination(path: Path) -> Path:
    if not path.exists():
        return path

    counter = 1
    while True:
        candidate = path.with_name(f"{path.stem} ({counter}){path.suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def organize_images() -> None:
    moved = 0

    for image_path in sorted(ROOT.iterdir()):
        if not image_path.is_file() or image_path.suffix.lower() not in IMAGE_SUFFIXES:
            continue

        folder_name = image_path.stem
        destination_dir = ROOT / folder_name / TARGET_SUBFOLDER
        destination_dir.mkdir(parents=True, exist_ok=True)

        destination = unique_destination(destination_dir / image_path.name)
        shutil.move(str(image_path), str(destination))
        moved += 1
        print(f"Moved {image_path.name} -> {destination.relative_to(ROOT)}")

    print(f"Done. Moved {moved} image(s).")


if __name__ == "__main__":
    organize_images()
