const app = express();
const PORT = process.env.PORT || 3001;

// Fix for Vercel SQLite Read-Only Filesystem
if (process.env.VERCEL) {
  const dbSource = path.join(__dirname, 'prisma', 'dev.db');
  const dbDest = '/tmp/dev.db';
  try {
    if (fs.existsSync(dbSource) && !fs.existsSync(dbDest)) {
      fs.copyFileSync(dbSource, dbDest);
    }
  } catch (e) {
    console.error('Failed to copy db', e);
  }
}

app.use(cors());