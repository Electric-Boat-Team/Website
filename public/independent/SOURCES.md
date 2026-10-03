# Independent Image Sources

All images were prepared from public Drive downloads in `/tmp/opencode`, not existing repository assets. Initial Drive IDs and source folders were checked against `boat-selected-assets.json` and `boat-drive-inventory.json`. The focused UFO additions were checked against `ufo-photo-survey.json`, the actual photographs, and original-download filename headers.

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
| `boat.jpg` | `685814682_1000689062303045_2442498384018522926_n.jpg` | `1zDR6ytkIinkL-ohoIU_4bf4P370pTnD1` | Shared/11 — Media Files/BTS - 2026-9-3 General Meeting/2026-9-3 - TWEBT - General meeting |
| `mount.jpg` | `Front Strut & Mast Connection Point Top View.heic` (Drive display name omits extension) | `1bDLhPeiZPjN375OD9nQSjJSDNoszUOsQ` | Shared/11 — Media Files/Pictures/Component Photos |
| `foil-detail.jpg` | `Front Strut 3.heic` (Drive display name: `Front Strut 3`) | `1RqJLdPazYeW6pfimqdpIDGPXh-2VrjZb` | Shared/11 — Media Files/Pictures/Component Photos |

View any original at `https://drive.google.com/file/d/DRIVE_FILE_ID/view`, replacing `DRIVE_FILE_ID` with its ID above.

## Processing

- The official logo was resized to a maximum 512-pixel long edge as PNG, retaining its alpha channel.
- The three original JPEG photographs were EXIF-oriented and resized to a maximum 1800-pixel long edge, with JPEG quality 85.
- The four HEIC-backed images use Google-generated JPEG previews, not conversions of the original HEIC files. Their local inputs were `products-and-boat-1-drive-preview.jpg`, `rudder-1-drive-preview.jpg`, `front-foil-2-drive-preview.jpg`, and `center-bow-front-view-drive-preview.jpg`, respectively. Preview retrieval used `https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w1600`.
- `rudder.jpg` and `bow.jpg` were copied byte-for-byte from their previews. The hull and foil previews exceeded 1800 pixels on the long edge and were downscaled with Lanczos resampling, then saved at JPEG quality 95 with no chroma subsampling. No image was upscaled.
- `boat.jpg` uses the original JPEG downloaded from `https://drive.usercontent.google.com/download?id=1zDR6ytkIinkL-ohoIU_4bf4P370pTnD1&export=download`. Its input is `/tmp/opencode/ufo-boat-input.jpg`, 960 x 723 pixels. It was EXIF-oriented, converted to RGB, and saved at JPEG quality 95 with no chroma subsampling; dimensions were retained without upscaling.
- `mount.jpg` and `foil-detail.jpg` use Google-generated JPEG previews retrieved with `https://drive.google.com/thumbnail?id=DRIVE_FILE_ID&sz=w2048`, not original HEIC conversions. Inputs are `/tmp/opencode/ufo-mount-input.jpg` and `/tmp/opencode/ufo-foil-detail-input.jpg`, both 2048 x 1152 pixels. They were EXIF-oriented, converted to RGB, downscaled with Lanczos to 1800 x 1013 pixels, and saved at JPEG quality 95 with no chroma subsampling. No cropping, retouching, or upscaling was applied.

## Preview Caveat

Google previews may have lower resolution, different compression, or stripped metadata compared with the originals. These derivatives should not be described as original-quality HEIC exports.

The hull photograph shows an outdoor catamaran refurbishment project on a trailer. It is another project image, not the workshop UFO shown in `workshop.jpg` and `workshop-detail.jpg`; its inclusion does not establish that the pictured hull shares their propulsion or foil integration.

## Focused UFO Selection

Reviewed 59 candidate photographs from Component Photos, Meeting Photos, and the September 3 BTS source-media folder using contact sheets, then visually inspected each of the three final output images. Survey files are `/tmp/opencode/ufo-photo-survey.json` and `/tmp/opencode/ufo-contact-sheet-0.jpg` through `ufo-contact-sheet-3.jpg`.

- `boat.jpg`: The complete white UFO catamaran hull rests on grass without people. The UFO marking, blue deck pads, and hull geometry match the workshop boat. Detached main and rudder foils lie on the deck, with sailing equipment alongside. This is the strongest inspected people-free whole-hull image, but it is only 960 x 723 pixels. It shows a disassembled sailing platform, not a completed powered hydrofoil or on-water operation. Use this instead of the other-project `hull.jpg` when illustrating the UFO conversion.
- `mount.jpg`: Close-up of the UFO's existing circular mast socket and adjacent elongated front-strut opening, with fasteners, deck hardware, and a tape measure. This documents the interface relevant to the planned propulsion adaptation. It is not a photograph of an installed motor or a fabricated twin-motor adapter bracket. Suggested caption: "UFO mast-base and front-strut interface under measurement."
- `foil-detail.jpg`: End-on photograph of the hollow front-strut section, showing its streamlined profile and internal webs. The source names it Front Strut 3, so describe it as a strut cross-section, not a lifting-foil cross-section or motor mount. The alloy and structural performance are not established by the photograph. Suggested caption: "Front-strut cross-section and internal geometry."

The three additions show the UFO platform or its documented components, not the restored larger catamaran, other teams' boats, or stock images. No image demonstrates completed electric propulsion, powered foiling, autonomy, race readiness, or race results.

## Competition Year Verification

Checked October 2, 2026. No standalone code or competition copy was changed.

- Public Drive document: `PEP2027 Hydrofoil - Systems Worksheet`, ID `1sXU9fNe0E9ZP0bWtLJHmZaiyLCSEWSWAVcbGc73irw8`, in Shared/03 — Engineering (The Boat). Its heading reads "Systems for UFO hydrofoil conversion - PEP2027". Anonymous text export works at `https://docs.google.com/document/d/1sXU9fNe0E9ZP0bWtLJHmZaiyLCSEWSWAVcbGc73irw8/export?format=txt`; the spreadsheet export previously attempted was the wrong document type.
- The worksheet describes planned mast-base adaptation to a lower symmetrical propulsion strut, a bracket for two motors, and electrical cable routing. These are design tasks, not proof that the hardware is installed or tested. Financial details were not reproduced.
- Organizer source: `https://www.navalengineers.org/Education/Promoting-Electric-Propulsion-PEP`. Its current PEP27 schedule lists PEP East in Portsmouth, VA, April 13-16, 2027. The Crewed - Displacement commitments list includes "University of Maryland (New!)". The organizer page also retains older PEP26 content; use its explicit PEP27 schedule rather than undated legacy paragraphs.
- The repository's `content/home.html` says ASNE PEP East 2027. That agrees with the Drive worksheet year and organizer schedule. Calling this project's target "PEP26" conflicts with those sources. The evidence supports a PEP2027 target and a publicly listed displacement commitment, not past participation or completed race capability. The naming mismatch still needs owner confirmation if 2026 was intentional.
