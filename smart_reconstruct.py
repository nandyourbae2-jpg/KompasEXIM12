import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
lines_of_file = []

with open(transcript_path, "r") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for call in data.get("tool_calls", []):
                    if call.get("name") == "write_to_file":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            lines_of_file = args.get("CodeContent", "").split('\n')
                            
                    elif call.get("name") in ["replace_file_content", "multi_replace_file_content"]:
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            chunks = args.get("ReplacementChunks", [])
                            if not chunks:
                                chunks = [{
                                    "StartLine": args.get("StartLine"),
                                    "EndLine": args.get("EndLine"),
                                    "TargetContent": args.get("TargetContent", ""),
                                    "ReplacementContent": args.get("ReplacementContent", "")
                                }]
                            
                            # Valid patches are applied
                            valid_chunks = []
                            for c in chunks:
                                start = c["StartLine"] - 1
                                end = c["EndLine"]
                                target = c.get("TargetContent", "")
                                block_in_file = "\n".join(lines_of_file[start:end])
                                if target == block_in_file:
                                    valid_chunks.append(c)
                                else:
                                    # IDE sometimes strips a trailing newline in block? Let's check with and without trailing newline
                                    if target + "\n" == block_in_file or target == block_in_file + "\n" or target.strip() == block_in_file.strip():
                                        valid_chunks.append(c)
                            
                            valid_chunks.sort(key=lambda x: x["StartLine"], reverse=True)
                            
                            for c in valid_chunks:
                                start = c["StartLine"] - 1
                                end = c["EndLine"]
                                replacement_content = c.get("ReplacementContent") or ""
                                replacement_lines = replacement_content.split('\n') if replacement_content else []
                                lines_of_file = lines_of_file[:start] + replacement_lines + lines_of_file[end:]
        except Exception:
            pass

with open("perfect_index.js", "w") as out:
    out.write("\n".join(lines_of_file))

print(f"Perfect reconstruction length: {len(lines_of_file)}")
