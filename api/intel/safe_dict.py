"""SafeDict — crash-proof dict subclass for template.format_map() calls.

Per POLARIS_FINAL_EXECUTION_BLUEPRINT.md §E.2.2:
  "Use a defaultdict-style formatter that returns the literal {key} for
   missing values. This makes missing fields visible in the output rather
   than crashing — easier to spot and fix during dev."

Usage:
    from api.intel.safe_dict import SafeDict

    markdown = template.format_map(SafeDict(values_dict))
"""


class SafeDict(dict):  # type: ignore[type-arg]
    """dict subclass that returns a visible placeholder for missing keys.

    Prevents KeyError from crashing report generation when a template
    placeholder has no corresponding value in the values dict.
    """

    def __missing__(self, key: str) -> str:
        return f"[MISSING: {key}]"
