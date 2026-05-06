const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Yüklenen görselleri sun
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
app.use("/uploads", express.static(UPLOADS_DIR));

// Multer ayarı: uploads/ klasörüne kaydet
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `vehicle_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Görsel yükleme endpoint'i
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Dosya yüklenemedi." });
  const url = `http://localhost:3002/uploads/${req.file.filename}`;
  console.log(`[VehicleService] Görsel yüklendi: ${req.file.filename}`);
  res.json({ url });
});

// ── Araç verisi ──
const DATA_FILE = path.join(__dirname, "vehicles.json");

const defaultVehicles = [
  {
    id: 1,
    brand: "Toyota",
    model: "Corolla",
    segment: "Economy",
    pricePerDay: 150,
    campus: "Yaşar Üniversitesi",
    km: 45000,
    available: true,
    ownerId: 2,
    image: "car1.jpeg",
  },
  {
    id: 2,
    brand: "Honda",
    model: "Civic",
    segment: "Economy",
    pricePerDay: 180,
    campus: "Ege Üniversitesi",
    km: 62000,
    available: true,
    ownerId: 2,
    image: "car2.jpeg",
  },
  {
    id: 3,
    brand: "BMW",
    model: "3 Series",
    segment: "Premium",
    pricePerDay: 400,
    campus: "Yaşar Üniversitesi",
    km: 28000,
    available: true,
    ownerId: 2,
    image: "car3.jpeg",
  },
  {
    id: 4,
    brand: "Renault",
    model: "Clio",
    segment: "Economy",
    pricePerDay: 120,
    campus: "Ege Üniversitesi",
    km: 85000,
    available: true,
    ownerId: 2,
    image: "car4.jpeg",
  },
];

let vehicles = [];
let nextId = 5;

function logVehicleStats() {
  const musait = vehicles.filter((v) => v.available).length;
  const kirada = vehicles.filter((v) => !v.available).length;
  console.log(`   ${vehicles.length} araç: ${musait} müsait, ${kirada} kirada`);
}

function load() {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    vehicles = data.vehicles;
    nextId = data.nextId;
    console.log(`[VehicleService] vehicles.json yüklendi`);
    logVehicleStats();
  } else {
    vehicles = [...defaultVehicles];
    save();
    console.log("[VehicleService] Varsayılan araçlar oluşturuldu.");
    logVehicleStats();
  }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ vehicles, nextId }, null, 2));
}

load();

app.get("/api/vehicles", (req, res) => {
  const musait = vehicles.filter((v) => v.available).length;
  const kirada = vehicles.filter((v) => !v.available).length;
  console.log(
    `[VehicleService] Araç listesi istendi → ${vehicles.length} araç döndürüldü (${musait} müsait, ${kirada} kirada)`,
  );
  res.json(vehicles);
});

app.get("/api/vehicles/:id", (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) {
    console.log(`[VehicleService] ✗ Araç bulunamadı → #${req.params.id}`);
    return res.status(404).json({ error: "Araç bulunamadı." });
  }
  console.log(
    `[VehicleService] Araç sorgulandı → #${vehicle.id} ${vehicle.brand} ${vehicle.model} | Durum: ${vehicle.available ? "Müsait" : "Kirada"}`,
  );
  res.json(vehicle);
});

app.patch("/api/vehicles/:id/availability", (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) return res.status(404).json({ error: "Araç bulunamadı." });
  const onceki = vehicle.available ? "Müsait" : "Kirada";
  vehicle.available = req.body.available;
  const sonraki = vehicle.available ? "Müsait" : "Kirada";
  save();
  console.log(
    `[VehicleService] ✓ Araç #${vehicle.id} (${vehicle.brand} ${vehicle.model}) → ${onceki} ➜ ${sonraki}`,
  );
  logVehicleStats();
  res.json(vehicle);
});

app.post("/api/vehicles", (req, res) => {
  const { brand, model, segment, pricePerDay, campus, ownerId, image, km } =
    req.body;
  const vehicle = {
    id: nextId++,
    brand,
    model,
    segment,
    pricePerDay: Number(pricePerDay),
    campus,
    km: km ? Number(km) : null,
    available: true,
    archived: false,
    ownerId,
    image: image || "",
  };
  vehicles.push(vehicle);
  save();
  console.log(
    `[VehicleService] ✓ Araç eklendi → #${vehicle.id} ${brand} ${model} | ${segment} | ₺${vehicle.pricePerDay}/gün | ${campus}`,
  );
  logVehicleStats();
  res.status(201).json(vehicle);
});

// ── Araç düzenle ─────────────────────────────────────────────────────────────
app.put("/api/vehicles/:id", (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) return res.status(404).json({ error: "Araç bulunamadı." });
  if (!vehicle.available)
    return res.status(400).json({ error: "Kirada olan araç düzenlenemez." });

  const { brand, model, segment, pricePerDay, campus, image, km } = req.body;
  if (brand) vehicle.brand = brand;
  if (model) vehicle.model = model;
  if (segment) vehicle.segment = segment;
  if (pricePerDay) vehicle.pricePerDay = Number(pricePerDay);
  if (campus) vehicle.campus = campus;
  if (image !== undefined) vehicle.image = image;
  if (km !== undefined) vehicle.km = km ? Number(km) : null;

  save();
  console.log(
    `[VehicleService] ✏️ Araç güncellendi → #${vehicle.id} ${vehicle.brand} ${vehicle.model}`,
  );
  res.json(vehicle);
});

// ── Arşivle / yayına al ───────────────────────────────────────────────────────
app.patch("/api/vehicles/:id/archive", (req, res) => {
  const vehicle = vehicles.find((v) => v.id === Number(req.params.id));
  if (!vehicle) return res.status(404).json({ error: "Araç bulunamadı." });
  if (!vehicle.available)
    return res.status(400).json({ error: "Kirada olan araç arşivlenemez." });

  vehicle.archived = !vehicle.archived;
  save();
  console.log(
    `[VehicleService] ${vehicle.archived ? "📦 Arşivlendi" : "✅ Yayına alındı"} → #${vehicle.id} ${vehicle.brand} ${vehicle.model}`,
  );
  res.json(vehicle);
});

// ── Araç sil ──────────────────────────────────────────────────────────────────
app.delete("/api/vehicles/:id", (req, res) => {
  const idx = vehicles.findIndex((v) => v.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: "Araç bulunamadı." });
  const vehicle = vehicles[idx];
  if (!vehicle.available)
    return res.status(400).json({ error: "Kirada olan araç silinemez." });

  vehicles.splice(idx, 1);
  save();
  console.log(
    `[VehicleService] 🗑️ Araç silindi → #${vehicle.id} ${vehicle.brand} ${vehicle.model}`,
  );
  logVehicleStats();
  res.json({ success: true });
});

if (require.main === module) {
  app.listen(3002, () => {
    console.log("✅ Vehicle Service  → http://localhost:3002");
    logVehicleStats();
  });
}

module.exports = app;
