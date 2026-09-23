#!/usr/bin/env python3
"""Importe une image de la maquette Figma V3 dans public/v3/ au format WebP.

Usage : python3 scripts/v3-asset.py <url-ou-chemin> <nom> [largeur-max] [qualité]
  - <url-ou-chemin> : URL d'asset Figma (https://www.figma.com/api/mcp/asset/...) ou fichier local
  - <nom>           : nom de fichier sans extension (ex. home-hero)
  - largeur-max     : 1920 par défaut ; l'image n'est jamais agrandie
  - qualité         : 82 par défaut

Les PNG avec transparence restent en WebP avec alpha. Affiche le chemin public
et les dimensions finales (à reporter dans width/height des <img>).
"""
import io
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "v3"


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    source, name = sys.argv[1], sys.argv[2]
    max_width = int(sys.argv[3]) if len(sys.argv) > 3 else 1920
    quality = int(sys.argv[4]) if len(sys.argv) > 4 else 82

    if source.startswith("http"):
        with urllib.request.urlopen(source) as response:
            data = response.read()
    else:
        data = Path(source).read_bytes()

    image = Image.open(io.BytesIO(data))
    has_alpha = image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info)
    image = image.convert("RGBA" if has_alpha else "RGB")
    if image.width > max_width:
        height = round(image.height * max_width / image.width)
        image = image.resize((max_width, height), Image.LANCZOS)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    target = OUT_DIR / f"{name}.webp"
    image.save(target, "WEBP", quality=quality, method=6)
    print(f"/v3/{target.name} {image.width}x{image.height} {target.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
