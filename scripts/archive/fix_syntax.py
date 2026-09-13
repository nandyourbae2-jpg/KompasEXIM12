import re
import sys

with open('backend/index.js', 'r') as f:
    lines = f.readlines()

new_lines = []
stack = []

for i, line in enumerate(lines):
    if 'catchErrors(' in line and '=> {' in line:
        stack.append(True)
    
    # We are looking for the closing `});` of the route which is typically unindented or indented with 0 spaces
    if line.startswith('});'):
        if stack:
            # Pop the stack and replace with `}));`
            stack.pop()
            line = line.replace('});', '}));')
    
    new_lines.append(line)

with open('backend/index.js', 'w') as f:
    f.writelines(new_lines)

print(f"Fixed parenthesis, remaining stack: {len(stack)}")
