import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');

// Ensure json parsing for api routes with body size for photos
app.use(express.json({ limit: '15mb' }));

// Cloud Run and deployment health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'TowerTech Society Management System',
    timestamp: new Date().toISOString()
  });
});

// Storage directory for visitor photos
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'visitor-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve public uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '7d'
}));

// API Endpoint to securely store visitor live photos
app.post('/api/visitor-photos', (req, res) => {
  try {
    const { photoData, fileName } = req.body;
    if (!photoData || typeof photoData !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing photo data' });
    }

    const matches = photoData.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid data URL format' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const safeName = (fileName || `photo_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = `${safeName}.${ext}`;
    const targetFile = path.join(uploadsDir, finalFilename);

    fs.writeFileSync(targetFile, Buffer.from(base64Data, 'base64'));

    return res.status(200).json({
      success: true,
      url: `/uploads/visitor-photos/${finalFilename}`
    });
  } catch (err) {
    console.error('[Visitor Photo Upload Error]:', err);
    return res.status(500).json({ success: false, error: 'Server photo save failed' });
  }
});

// Serve static assets from built Vite dist folder
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: true
  }));
}

// SPA fallback: any non-static route serves index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>TowerTech Society Management</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2>TowerTech Society Management System</h2>
          <p>Application is initializing. Please refresh in a few moments.</p>
        </body>
      </html>
    `);
  }
});

// Port handling:
// Cloud Run probe specifically checks port 3000.
// Cloud Run may also provide PORT environment variable (e.g. 8080 or 3000).
const primaryPort = parseInt(process.env.PORT || '3000', 10);

const mainServer = app.listen(primaryPort, '0.0.0.0', () => {
  console.log(`[TowerTech Server] Listening on http://0.0.0.0:${primaryPort}`);
});

mainServer.on('error', (err) => {
  console.error('[TowerTech Server] Main server error:', err);
});

// If the primary port was NOT 3000, also start a secondary listener on port 3000
// so that the Cloud Run startup TCP probe on port 3000 immediately passes
if (primaryPort !== 3000) {
  try {
    const probeServer = app.listen(3000, '0.0.0.0', () => {
      console.log(`[TowerTech Server] Startup probe listener active on http://0.0.0.0:3000`);
    });
    probeServer.on('error', (err) => {
      console.log(`[TowerTech Server] Probe listener on 3000 notice: ${err.message}`);
    });
  } catch (err) {
    console.log('[TowerTech Server] Could not bind secondary 3000 probe port:', err);
  }
}
