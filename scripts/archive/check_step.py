import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
patch_count = 0

with open(transcript_path, "r") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                calls = data.get("tool_calls", [])
                patch_calls = [c for c in calls if c.get("name") in ["replace_file_content", "multi_replace_file_content"] and c.get("args", {}).get("TargetFile", "").endswith("backend/index.js")]
                if patch_calls:
                    print(f"Step {idx}: {len(patch_calls)} patches")
        except Exception:
            pass
