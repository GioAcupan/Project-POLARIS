import asyncio
import traceback

from api.intel.llm_client import GeminiClient


async def main():
    c = GeminiClient()
    try:
        r = await c.complete(
            system_prompt="You are a test bot.",
            user_content="Say hi in 5 words.",
        )
        print("OK:", r)
    except Exception as e:
        print(f"FAIL: {type(e).__name__}: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
