"""Raw Gemini SDK test - expose the real error."""

import os
import traceback
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

key = os.getenv("GOOGLE_GEMINI_API_KEY", "").strip()
print(f"Key prefix: {key[:6]}...")
print(f"Key length: {len(key)}")
print()

client = genai.Client(api_key=key)

# Try to list models first
print("=== List models ===")
try:
    for m in client.models.list():
        actions = m.supported_actions if hasattr(m, "supported_actions") else "(no action info)"
        print(f"  {m.name}: {actions}")
except Exception as e:
    print(f"LIST FAILED: {type(e).__name__}")
    traceback.print_exc()

print()
print("=== Generate content test ===")
for model_name in ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"]:
    try:
        resp = client.models.generate_content(
            model=model_name,
            contents="Say hi in 3 words.",
        )
        print(f"  {model_name}: OK -> {resp.text!r}")
        break
    except Exception as e:
        print(f"  {model_name}: FAIL -> {type(e).__name__}: {str(e)[:300]}")
