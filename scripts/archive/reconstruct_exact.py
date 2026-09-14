import json

transcript_path = "/Users/macbookair/.gemini/antigravity-ide/brain/0987f684-a702-45ee-a464-e4140a7932a0/.system_generated/logs/transcript_full.jsonl"
file_content = ""

with open(transcript_path, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "PLANNER_RESPONSE":
                for call in data.get("tool_calls", []):
                    if call.get("name") == "write_to_file":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            file_content = args.get("CodeContent")
                            
                    elif call.get("name") == "replace_file_content":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            target = args.get("TargetContent", "")
                            replacement = args.get("ReplacementContent", "")
                            if target in file_content:
                                file_content = file_content.replace(target, replacement)
                            else:
                                print("TARGET NOT FOUND IN replace_file_content")
                                
                    elif call.get("name") == "multi_replace_file_content":
                        args = call.get("args", {})
                        if args.get("TargetFile", "").endswith("backend/index.js"):
                            chunks = args.get("ReplacementChunks", [])
                            for c in chunks:
                                target = c.get("TargetContent", "")
                                replacement = c.get("ReplacementContent", "")
                                if target in file_content:
                                    file_content = file_content.replace(target, replacement)
                                else:
                                    print("TARGET NOT FOUND IN multi_replace_file_content")
        except Exception:
            pass

with open("reconstructed_exact.js", "w") as out:
    out.write(file_content)

print(f"Reconstructed exact with length: {len(file_content)}")
print(f"Line count: {len(file_content.split(chr(10)))}")
