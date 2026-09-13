import sys

with open('src/pages/Staff/index.js', 'r') as f:
    content = f.read()

new_exports = """
export { default as AeMyJobs } from './AeMyJobs';
export { default as AeTodaysActions } from './AeTodaysActions';
export { default as AeDocuments } from './AeDocuments';
export { default as AeWaiting } from './AeWaiting';
export { default as AeHandover } from './AeHandover';
export { default as AeHistory } from './AeHistory';
export { default as AeNotifications } from './AeNotifications';
"""

if "AeMyJobs" not in content:
    content += new_exports
    with open('src/pages/Staff/index.js', 'w') as f:
        f.write(content)
    print("Patched index.js exports")
else:
    print("Already patched")
