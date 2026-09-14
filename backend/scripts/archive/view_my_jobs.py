with open('src/routes/v2/aeRoutes.js', 'r') as f:
    content = f.read()
idx = content.find("router.get('/my-jobs'")
print(content[idx:idx+800])
