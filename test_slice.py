import json

with open("debug_index_21.js") as f:
    lines = f.read().split('\n')

print(f"Total lines: {len(lines)}")
start = 713
print(f"lines[:713] first line: {lines[:713][0]}")
