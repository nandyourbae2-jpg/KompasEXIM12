import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
patch_count = 0

with open(transcript_path, "r") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for call in data.get("tool_calls", []):
                    if call.get("name") == "write_to_file":
                        patch_count = 0
                    elif call.get("name") in ["replace_file_content", "multi_replace_file_content"]:
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            patch_count += 1
                            if patch_count == 22:
                                print(json.dumps(args, indent=2))
        except Exception:
            pass
