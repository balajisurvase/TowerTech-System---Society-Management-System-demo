import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');

// Middleware: JSON parsing with body size limit for photos (5MB max)
app.use(express.json({ limit: '5mb' }));

// Simple in-memory rate limiting map
const rateLimitMap = new Map();

function applyRateLimit(limitWindowMs = 15 * 60 * 1000, maxRequests = 20) {
  return (req, res, next) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const now = Date.now();
    const record = rateLimitMap.get(clientIp) || { count: 0, resetAt: now + limitWindowMs };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + limitWindowMs;
    } else {
      record.count += 1;
    }

    rateLimitMap.set(clientIp, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }

    next();
  };
}

// Health check endpoint for deployment probes
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    service: 'TowerTech Society Management System',
    timestamp: new Date().toISOString()
  });
});

// Storage directory for visitor photos & document uploads
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'visitor-photos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve public uploads statically with cache headers
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  maxAge: '7d'
}));

// API Endpoint: Secure visitor live photo upload
app.post('/api/visitor-photos', applyRateLimit(5 * 60 * 1000, 30), (req, res) => {
  try {
    const { photoData } = req.body;
    if (!photoData || typeof photoData !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid photo payload' });
    }

    const matches = photoData.match(/^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid or unsupported image format. Allowed: JPG, PNG, WEBP' });
    }

    const mimeType = matches[1].toLowerCase();
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const base64Data = matches[3];
    const buffer = Buffer.from(base64Data, 'base64');

    // Max file size: 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Image size exceeds maximum 5MB limit' });
    }

    // Generate safe random file name
    const randomHex = crypto.randomBytes(8).toString('hex');
    const finalFilename = `visitor_${Date.now()}_${randomHex}.${ext}`;
    const targetFile = path.join(uploadsDir, finalFilename);

    fs.writeFileSync(targetFile, buffer);

    return res.status(200).json({
      success: true,
      url: `/uploads/visitor-photos/${finalFilename}`
    });
  } catch (err) {
    console.error('[Visitor Photo Upload Error]:', err);
    return res.status(500).json({ success: false, error: 'Server photo save failed' });
  }
});

// Serve static assets from Vite build directory
if (fs.existsSync(distPath)) {
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));
  app.use(express.static(distPath, {
    maxAge: '1h',
    etag: true
  }));
}

// SPA fallback: serve index.html for unknown non-API routes
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
          <p>Application is starting. Please refresh shortly.</p>
        </body>
      </html>
    `);
  }
});

// Port configuration
const primaryPort = parseInt(process.env.PORT || '3000', 10);

const mainServer = app.listen(primaryPort, '0.0.0.0', () => {
  console.log(`[TowerTech Server] Listening on http://0.0.0.0:${primaryPort}`);
});

mainServer.on('error', (err) => {
  console.error('[TowerTech Server] Server error:', err);
});

if (primaryPort !== 3000) {
  try {
    const probeServer = app.listen(3000, '0.0.0.0', () => {
      console.log(`[TowerTech Server] Startup probe active on http://0.0.0.0:3000`);
    });
    probeServer.on('error', (err) => {
      console.log(`[TowerTech Server] Probe listener notice: ${err.message}`);
    });
  } catch (err) {
    console.log('[TowerTech Server] Probe port setup notice:', err);
  }
}
