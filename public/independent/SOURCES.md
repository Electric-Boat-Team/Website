# Independent Image Sources

All images were prepared from selected Drive downloads in `/tmp/opencode`, not existing repository assets. Drive IDs and source folders were checked against `boat-selected-assets.json` and `boat-drive-inventory.json`.

| Output | Original filename | Drive file ID | Source folder |
| --- | --- | --- | --- |
| `logo.png` | `Terrapin-Works-Electric-Boat-Team---Basic-logo-concept2---raster-highres.png` | `1aUNAb7gfxAZJ0NnttPJtLEhR56EMsa8r` | Shared/11 — Media Files/Logos and assets |
| `workshop.jpg` | `IMG_9444.jpg` | `1gcP9jIBCpA9-Goul7AaNfc108Wld24Zy` | Shared/11 — Media Files/BTS - 2026-9-3 General Meeting/2026-9-3 - TWEBT - General meeting |
| `workshop-detail.jpg` | `IMG_9445.jpg` | `1V_ofX4oP-GuPL8a0pEKo43SGTk6jSDmW` | Shared/11 — Media Files/BTS - 2026-9-3 General Meeting/2026-9-3 - TWEBT - General meeting |
| `team.jpg` | `IMG_9547.jpg` | `1dU4HvIYNo3lFY8ZFp4zu_W868wfFf-if` | Shared/11 — Media Files/Pictures/Meeting Photos |
| `hull.jpg` | `6-2026-TB-Products&Boat1.HEIC` | `1YNL0G2M9xJiF2LEx0ItLZ1qQTJpOfz3W` | Shared/11 — Media Files/Sponsorship/6-2026 - Total Boat |
| `rudder.jpg` | `Rudder 1.heic` (Drive display name: `Rudder 1`) | `1AiOtY6meBGtVQZpPsFNUvvLHdE8CS9-w` | Shared/11 — Media Files/Pictures/Component Photos |
| `foil.jpg` | `Front Foil 2.heic` (Drive display name: `Front Foil 2`) | `1YsK5jd7muAUYx0ppF1FNohe6itos-fvh` | Shared/11 — Media Files/Pictures/Component Photos |
| `bow.jpg` | `Center Bow Front View.heic` (Drive display name: `Center Bow Front View`) | `1WqTbs2ltSZxpki6nPF153kRljqczS1U2` | Shared/11 — Media Files/Pictures/Component Photos |

View any original at `https://drive.google.com/file/d/DRIVE_FILE_ID/view`, replacing `DRIVE_FILE_ID` with its ID above.

## Processing

- The official logo was resized to a maximum 512-pixel long edge as PNG, retaining its alpha channel.
- The three original JPEG photographs were EXIF-oriented and resized to a maximum 1800-pixel long edge, with JPEG quality 85.
- The four HEIC-backed images use Google-generated JPEG previews, not conversions of the original HEIC files. Their local inputs were `products-and-boat-1-drive-preview.jpg`, `rudder-1-drive-preview.jpg`, `front-foil-2-drive-preview.jpg`, and `center-bow-front-view-drive-preview.jpg`, respectively. Preview retrieval used `https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w1600`.
- `rudder.jpg` and `bow.jpg` were copied byte-for-byte from their previews. The hull and foil previews exceeded 1800 pixels on the long edge and were downscaled with Lanczos resampling, then saved at JPEG quality 95 with no chroma subsampling. No image was upscaled.

## Preview Caveat

Google previews may have lower resolution, different compression, or stripped metadata compared with the originals. These derivatives should not be described as original-quality HEIC exports.

The hull photograph shows an outdoor catamaran refurbishment project on a trailer. It is another project image, not the workshop UFO shown in `workshop.jpg` and `workshop-detail.jpg`; its inclusion does not establish that the pictured hull shares their propulsion or foil integration.
