# PITCH_MODE form templates (manual assets)

These files are **not** generated at runtime. Place the following assets in this directory (`api/templates/forms/`) for a complete `POLARIS_PITCH_MODE` demo:

| File | Purpose |
|------|---------|
| `csc_form_212.xlsx` | CSC Form 212 source workbook for mapping and generation. |
| `demo_pds_prefilled.xlsx` | Pre-filled PDS workbook used in the happy-path flow. |
| `demo_pds_preview.png` | Success-screen preview image after sign-up (matches blueprint pitch script). |

## Status (workspace check)

Run your own check before demos; the repo may omit large binaries.

- `csc_form_212.xlsx` — **present** in this folder (as of last scaffold).
- `demo_pds_prefilled.xlsx` — **missing**: add this file before relying on prefilled PDS in PITCH_MODE.
- `demo_pds_preview.png` — **missing**: add this file so the post sign-up screen can show the mandated preview.

If any mandatory file is absent, PITCH_MODE flows that depend on it will fail or show broken UI until you add the asset.
