import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html, admin.html

const DB = path.join(__dirname, "locations.log");

// POST: Save a new location
app.post("/api/locations", (req, res) => {
  const { lat, lon, accuracy, at, ua } = req.body || {};
  if (typeof lat !== "number" || typeof lon !== "number") {
    return res.status(400).json({ ok: false, error: "Invalid lat/lon" });
  }

  const record = {
    lat,
    lon,
    accuracy: typeof accuracy === "number" ? accuracy : null,
    at: at || new Date().toISOString(),
    ua: ua || null,
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
  };

  try {
    fs.appendFileSync(DB, JSON.stringify(record) + "\n", "utf8");
    console.log("Saved location:", record);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to persist" });
  }
});

// GET: Fetch all stored locations
app.get("/api/locations", (req, res) => {
  try {
    if (!fs.existsSync(DB)) return res.json([]);
    const lines = fs.readFileSync(DB, "utf8").trim().split("\n");
    const records = lines.map(line => JSON.parse(line));
    res.json(records);
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: "Failed to load" });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
