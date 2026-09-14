import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
count = 0
with open(transcript_path, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for call in data.get("tool_calls", []):
                    if call.get("name") == "write_to_file":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            count += 1
                            print(f"Write {count}: Length {len(args.get('CodeContent', ''))}")
        except Exception:
            pass
