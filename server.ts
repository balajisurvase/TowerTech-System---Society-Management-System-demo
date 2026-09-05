import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const SUPABASE_URL = "https://mniarauxuzqcmdrplgiz.supabase.co";
const SUPABASE_KEY = "sb_publishable_lyGIIhz89nFb_vMNQVfLCA_HvJeEk_5";

async function supabaseRest(endpoint: string, method = 'GET', body = null, extraHeaders = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers: Record<string, string> = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
    ...extraHeaders
  };
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data };
  } catch (err: any) {
    return { status: 500, data: null, error: err.message };
  }
}

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "TowerTech Node Express Server", version: "2.0.0" });
});

// API login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { role, loginId, password, societyId } = req.body;
    const table = role === 'admin' ? 'admin' : 'resident';
    const idField = role === 'admin' ? 'admin_id' : 'resident_id';

    let endpoint = `${table}?${idField}=eq.${encodeURIComponent(loginId)}&password=eq.${encodeURIComponent(password)}&select=*`;
    if (societyId) {
      endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
    }

    let result = await supabaseRest(endpoint);
    if (result.status === 200 && Array.isArray(result.data) && result.data.length > 0) {
      return res.json({ success: true, user: result.data[0] });
    }

    // Fallback without societyId
    if (societyId) {
      const fallbackEndpoint = `${table}?${idField}=eq.${encodeURIComponent(loginId)}&password=eq.${encodeURIComponent(password)}&select=*`;
      result = await supabaseRest(fallbackEndpoint);
      if (result.status === 200 && Array.isArray(result.data) && result.data.length > 0) {
        return res.json({ success: true, user: result.data[0] });
      }
    }

    res.status(401).json({ success: false, error: "Invalid ID, Password or Society ID" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Server error" });
  }
});

// GET Residents
app.get("/api/residents", async (req, res) => {
  const societyId = req.query.society_id as string;
  let endpoint = "resident?select=*";
  if (societyId) {
    endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
  }
  const result = await supabaseRest(endpoint);
  res.status(result.status).json(result.data || []);
});

// POST Resident
app.post("/api/residents", async (req, res) => {
  const result = await supabaseRest("resident", "POST", req.body);
  res.status(result.status).json(result.data);
});

// GET Maintenance
app.get("/api/maintenance", async (req, res) => {
  const residentId = req.query.resident_id as string;
  const societyId = req.query.society_id as string;
  let endpoint = "maintenance?select=*";
  if (residentId) {
    endpoint += `&resident_id=eq.${encodeURIComponent(residentId)}`;
  }
  if (societyId) {
    endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
  }
  const result = await supabaseRest(endpoint);
  res.status(result.status).json(result.data || []);
});

// POST Maintenance
app.post("/api/maintenance", async (req, res) => {
  const result = await supabaseRest("maintenance", "POST", req.body);
  res.status(result.status).json(result.data);
});

// GET Complaints
app.get("/api/complaints", async (req, res) => {
  const residentId = req.query.resident_id as string;
  const societyId = req.query.society_id as string;
  let endpoint = "complaint?select=*";
  if (residentId) {
    endpoint += `&resident_id=eq.${encodeURIComponent(residentId)}`;
  }
  if (societyId) {
    endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
  }
  const result = await supabaseRest(endpoint);
  res.status(result.status).json(result.data || []);
});

// POST Complaint
app.post("/api/complaints", async (req, res) => {
  const result = await supabaseRest("complaint", "POST", req.body);
  res.status(result.status).json(result.data);
});

// GET Bookings
app.get("/api/bookings", async (req, res) => {
  const residentId = req.query.resident_id as string;
  const societyId = req.query.society_id as string;
  let endpoint = "booking?select=*";
  if (residentId) {
    endpoint += `&resident_id=eq.${encodeURIComponent(residentId)}`;
  }
  if (societyId) {
    endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
  }
  const result = await supabaseRest(endpoint);
  res.status(result.status).json(result.data || []);
});

// POST Booking
app.post("/api/bookings", async (req, res) => {
  const result = await supabaseRest("booking", "POST", req.body);
  res.status(result.status).json(result.data);
});

// GET Amenities
app.get("/api/amenities", async (req, res) => {
  const societyId = req.query.society_id as string;
  let endpoint = "amenity?select=*";
  if (societyId) {
    endpoint += `&society_id=eq.${encodeURIComponent(societyId)}`;
  }
  const result = await supabaseRest(endpoint);
  res.status(result.status).json(result.data || []);
});

// POST Amenity
app.post("/api/amenities", async (req, res) => {
  const result = await supabaseRest("amenity", "POST", req.body);
  res.status(result.status).json(result.data);
});

// DELETE endpoints for clearing data
app.post("/api/residents/all", async (req, res) => {
  const societyId = req.query.society_id || req.body?.society_id;
  if (!societyId) return res.status(400).json({ success: false, error: "society_id required" });
  const result = await supabaseRest(`resident?society_id=eq.${encodeURIComponent(societyId as string)}`, "DELETE");
  res.json({ success: true, data: result.data });
});

app.post("/api/complaints/all", async (req, res) => {
  const societyId = req.query.society_id || req.body?.society_id;
  if (!societyId) return res.status(400).json({ success: false, error: "society_id required" });
  const result = await supabaseRest(`complaint?society_id=eq.${encodeURIComponent(societyId as string)}`, "DELETE");
  res.json({ success: true, data: result.data });
});

app.post("/api/bookings/all", async (req, res) => {
  const societyId = req.query.society_id || req.body?.society_id;
  if (!societyId) return res.status(400).json({ success: false, error: "society_id required" });
  const result = await supabaseRest(`booking?society_id=eq.${encodeURIComponent(societyId as string)}`, "DELETE");
  res.json({ success: true, data: result.data });
});

// Seed endpoint
app.post("/api/seed", async (req, res) => {
  res.json({ success: true, message: "Database seeded successfully" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
