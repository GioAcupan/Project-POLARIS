# PITCH_MODE — mandatory form assets

Commit these files under `api/templates/forms/` for the blueprint happy path when `POLARIS_PITCH_MODE=true`:

| Asset | Role |
|-------|------|
| `csc_form_212.xlsx` | Source CSC Form 212 workbook for cell mapping and generated outputs. |
| `demo_pds_prefilled.xlsx` | Pre-filled PDS workbook (Sir Renato seed values); copied per registration in pitch flows. |
| `demo_pds_preview.png` | Post sign-up success preview image shown in the demo script. |

Without all three, pitch-time form copy and UI preview steps may fail or degrade.

**Repo check:** all three assets above should be committed under `api/templates/forms/` for a full pitch path.
