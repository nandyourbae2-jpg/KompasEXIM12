import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
lines_of_file = []
patch_count = 0

with open(transcript_path, "r") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for call in data.get("tool_calls", []):
                    if call.get("name") == "write_to_file":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            content = args.get("CodeContent")
                            lines_of_file = content.split('\n')
                            patch_count = 0
                            
                    elif call.get("name") in ["replace_file_content", "multi_replace_file_content"]:
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            chunks = args.get("ReplacementChunks", [])
                            if not chunks:
                                chunks = [{
                                    "StartLine": args.get("StartLine"),
                                    "EndLine": args.get("EndLine"),
                                    "ReplacementContent": args.get("ReplacementContent", "")
                                }]
                            
                            chunks.sort(key=lambda x: x["StartLine"], reverse=True)
                            
                            for c in chunks:
                                start = c["StartLine"] - 1
                                end = c["EndLine"]
                                replacement_content = c.get("ReplacementContent") or ""
                                replacement_lines = replacement_content.split('\n') if replacement_content else []
                                lines_of_file = lines_of_file[:start] + replacement_lines + lines_of_file[end:]
                            patch_count += 1
                            with open(f"debug_index_{patch_count}.js", "w") as out:
                                out.write("\n".join(lines_of_file))
        except Exception:
            pass
