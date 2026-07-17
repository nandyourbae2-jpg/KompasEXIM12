import re
import os

directory = 'src/pages/Workspace/ImportOps/tabs/'
for filename in os.listdir(directory):
    if filename.endswith('.jsx'):
        path = os.path.join(directory, filename)
        with open(path, 'r') as f:
            content = f.read()
            
        # Match component definitions: const Grid = ({ children }) => ( ... );
        pattern = re.compile(r'^\s*const (Grid\d*|Row) = \(\{.*?\}\) => \([\s\S]*?\n\s*\);\n', re.MULTILINE)
        
        extracted = []
        for match in pattern.finditer(content):
            # Extract code and un-indent 2 spaces
            code = match.group(0)
            code = "\n".join([line[2:] if line.startswith("  ") else line for line in code.split("\n")])
            extracted.append(code.strip())
            
        if not extracted:
            continue
            
        # Remove them from the file
        new_content = pattern.sub('', content)
        
        # Find the end of imports
        import_end_match = re.search(r'^(import .*?\n)+', new_content, re.MULTILINE)
        if import_end_match:
            import_end = import_end_match.end()
            final_content = (
                new_content[:import_end] +
                "\n" + "\n\n".join(extracted) + "\n\n" +
                new_content[import_end:]
            )
        else:
            # Fallback
            final_content = "\n\n".join(extracted) + "\n\n" + new_content
            
        with open(path, 'w') as f:
            f.write(final_content)
            
print("Fix applied.")
