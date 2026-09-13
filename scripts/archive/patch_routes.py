import sys

with open('src/App.jsx', 'r') as f:
    content = f.read()

# Add imports
if "AeMyJobs" not in content:
    imports = """import AeMyJobs from './pages/Staff/AeMyJobs';
import AeTodaysActions from './pages/Staff/AeTodaysActions';
import AeDocuments from './pages/Staff/AeDocuments';
import AeWaiting from './pages/Staff/AeWaiting';
import AeHandover from './pages/Staff/AeHandover';
import AeHistory from './pages/Staff/AeHistory';
import AeNotifications from './pages/Staff/AeNotifications';"""
    content = content.replace("import AeMyWork from './pages/Staff/AeMyWork';", "import AeMyWork from './pages/Staff/AeMyWork';\n" + imports)

# Add routes under Ae Staff
old_route = "<Route path=\"ae/dashboard\" element={<AeMyWork />} />"
new_routes = """<Route path="ae/dashboard" element={<AeMyWork />} />
              <Route path="ae/jobs" element={<AeMyJobs />} />
              <Route path="ae/actions" element={<AeTodaysActions />} />
              <Route path="ae/documents" element={<AeDocuments />} />
              <Route path="ae/waiting" element={<AeWaiting />} />
              <Route path="ae/handover" element={<AeHandover />} />
              <Route path="ae/history" element={<AeHistory />} />
              <Route path="ae/notifications" element={<AeNotifications />} />"""

if old_route in content:
    content = content.replace(old_route, new_routes)
    with open('src/App.jsx', 'w') as f:
        f.write(content)
    print("Patched App.jsx routes")
else:
    print("Route not found")
