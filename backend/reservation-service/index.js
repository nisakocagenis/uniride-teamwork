const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const VEHICLE_SERVICE = process.env.VEHICLE_SERVICE_URL || "https://uniride-vehicle-service.onrender.com";
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || "https://uniride-payment-service.onrender.com";

const DATA_FILE = path.join(__dirname, "reservations.json");
const RATINGS_FILE = path.join(__dirname, "ratings.json");

let reservations = [];
let nextId = 1;
let ratings = [];
let nextRatingId = 1;

function load() {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    reservations = data.reservations;
    nextId = data.nextId;
  }
}

function save() {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ reservations, nextId }, null, 2),
  );
}

function loadRatings() {
  if (fs.existsSync(RATINGS_FILE)) {
    const data = JSON.parse(fs.readFileSync(RATINGS_FILE, "utf8"));
    ratings = data.ratings;
    nextRatingId = data.nextId;
  }
}

function saveRatings() {
  fs.writeFileSync(
    RATINGS_FILE,
    JSON.stringify({ ratings, nextId: nextRatingId }, null, 2),
  );
}

load();
loadRatings();

// ── Rezervasyon oluştur ──────────────────────────────────────────────────────
app.post("/api/reservations", async (req, res) => {
  const {
    userId,
    renterName,
    vehicleId,
    startDate,
    endDate,
    amount,
    cardInfo,
  } = req.body;

  console.log(`\n[ReservationService] --- Yeni Rezervasyon Talebi ---`);
  console.log(
    `  Kiracı: ${renterName} (#${userId}), Araç: #${vehicleId}, Tutar: ₺${amount}`,
  );

  try {
    console.log(
      `[ReservationService] → VehicleService: Araç #${vehicleId} kontrol ediliyor...`,
    );
    const vehicleRes = await fetch(
      `${VEHICLE_SERVICE}/api/vehicles/${vehicleId}`,
    );
    const vehicle = await vehicleRes.json();

    if (!vehicle.available) {
      console.log(
        `[ReservationService] ✗ Araç müsait değil → ${vehicle.brand} ${vehicle.model}`,
      );
      return res.status(400).json({ error: "Bu araç şu an müsait değil." });
    }
    console.log(
      `[ReservationService] ✓ Araç müsait: ${vehicle.brand} ${vehicle.model}`,
    );

    const reservation = {
      id: nextId++,
      userId,
      renterName: renterName || `Kullanıcı #${userId}`,
      vehicleId,
      vehicle,
      startDate,
      endDate,
      amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    reservations.push(reservation);
    save();
    console.log(
      `[ReservationService] ✓ Rezervasyon oluşturuldu (pending) → #${reservation.id}`,
    );

    console.log(
      `[ReservationService] → PaymentService: ₺${amount} ödeme gönderiliyor...`,
    );
    const paymentRes = await fetch(`${PAYMENT_SERVICE}/api/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount, cardInfo }),
    });
    const payment = await paymentRes.json();

    if (!payment.success) {
      reservation.status = "failed";
      save();
      console.log(`[ReservationService] ✗ Ödeme başarısız.`);
      return res.status(400).json({ error: "Ödeme işlemi başarısız." });
    }
    console.log(
      `[ReservationService] ✓ Ödeme Escrow'a alındı → ${payment.transactionId}`,
    );

    reservation.status = "pending_approval";
    reservation.transactionId = payment.transactionId;
    save();
    console.log(
      `[ReservationService] ⏳ Araç sahibi onayı bekleniyor → #${reservation.id}`,
    );

    logStats();
    res.json(reservation);
  } catch (err) {
    console.error(`[ReservationService] HATA:`, err.message);
    res.status(500).json({ error: "Servis hatası. Lütfen tekrar deneyin." });
  }
});

// ── Onayla ──────────────────────────────────────────────────────────────────
app.patch("/api/reservations/:id/approve", async (req, res) => {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation)
    return res.status(404).json({ error: "Rezervasyon bulunamadı." });
  if (reservation.status !== "pending_approval")
    return res.status(400).json({ error: "Bu rezervasyon onaylanamaz." });

  reservation.status = "confirmed";
  reservation.approvedAt = new Date().toISOString();
  save();

  await fetch(
    `${VEHICLE_SERVICE}/api/vehicles/${reservation.vehicleId}/availability`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: false }),
    },
  );

  console.log(
    `[ReservationService] ✓ Rezervasyon onaylandı → #${reservation.id} | ${reservation.renterName}`,
  );
  logStats();
  res.json(reservation);
});

// ── Reddet ──────────────────────────────────────────────────────────────────
app.patch("/api/reservations/:id/reject", (req, res) => {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation)
    return res.status(404).json({ error: "Rezervasyon bulunamadı." });
  if (reservation.status !== "pending_approval")
    return res.status(400).json({ error: "Bu rezervasyon reddedilemez." });

  reservation.status = "rejected";
  reservation.rejectedAt = new Date().toISOString();
  save();

  console.log(
    `[ReservationService] ✗ Rezervasyon reddedildi → #${reservation.id} | ${reservation.renterName}`,
  );
  logStats();
  res.json(reservation);
});

// ── Araç iade et (kiracı) — base64 fotoğraflar ───────────────────────────
app.post("/api/reservations/:id/return", (req, res) => {
  const reservation = reservations.find(
    (r) => r.id === Number(req.params.id),
  );
  if (!reservation)
    return res.status(404).json({ error: "Rezervasyon bulunamadı." });
  if (reservation.status !== "confirmed")
    return res
      .status(400)
      .json({ error: "Sadece aktif kiralamalar iade edilebilir." });

  const { photos } = req.body;
  if (!photos || photos.length === 0)
    return res
      .status(400)
      .json({ error: "En az bir fotoğraf yüklemelisiniz." });

  reservation.status = "pending_return";
  reservation.returnPhotos = photos;
  reservation.returnSubmittedAt = new Date().toISOString();
  save();

  console.log(
    `[ReservationService] 📸 İade fotoğrafları yüklendi → #${reservation.id} | ${photos.length} fotoğraf`,
  );
  logStats();
  res.json(reservation);
});

// ── İadeyi onayla (owner) ──────────────────────────────────────────────────
app.patch("/api/reservations/:id/return-approve", async (req, res) => {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation)
    return res.status(404).json({ error: "Rezervasyon bulunamadı." });
  if (reservation.status !== "pending_return")
    return res
      .status(400)
      .json({ error: "Bu rezervasyon iade onayı beklemiyordu." });

  reservation.status = "completed";
  reservation.completedAt = new Date().toISOString();
  save();

  await fetch(
    `${VEHICLE_SERVICE}/api/vehicles/${reservation.vehicleId}/availability`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: true }),
    },
  );

  console.log(
    `[ReservationService] ✓ İade onaylandı → #${reservation.id} | Araç tekrar müsait`,
  );
  logStats();
  res.json(reservation);
});

// ── İptal et (kiracı) ───────────────────────────────────────────────────────
app.patch("/api/reservations/:id/cancel", (req, res) => {
  const reservation = reservations.find((r) => r.id === Number(req.params.id));
  if (!reservation)
    return res.status(404).json({ error: "Rezervasyon bulunamadı." });
  if (reservation.status !== "pending_approval")
    return res
      .status(400)
      .json({ error: "Sadece onay bekleyen rezervasyonlar iptal edilebilir." });

  reservation.status = "cancelled";
  reservation.cancelledAt = new Date().toISOString();
  save();

  console.log(
    `[ReservationService] 🚫 Rezervasyon iptal edildi → #${reservation.id} | ${reservation.renterName}`,
  );
  logStats();
  res.json(reservation);
});

// ── Puan ver ────────────────────────────────────────────────────────────────
app.post("/api/ratings", (req, res) => {
  const {
    reservationId,
    fromUserId,
    fromName,
    toUserId,
    stars,
    comment,
    type,
  } = req.body;

  const existing = ratings.find(
    (r) =>
      r.reservationId === reservationId &&
      r.fromUserId === fromUserId &&
      r.type === type,
  );
  if (existing)
    return res
      .status(400)
      .json({ error: "Bu rezervasyon için zaten puan verdiniz." });

  const rating = {
    id: nextRatingId++,
    reservationId,
    fromUserId,
    fromName,
    toUserId,
    stars,
    comment: comment || "",
    type,
    createdAt: new Date().toISOString(),
  };
  ratings.push(rating);
  saveRatings();

  console.log(
    `[ReservationService] ⭐ Puan → Rezervasyon #${reservationId}: ${fromName} → ${stars} yıldız`,
  );
  res.json(rating);
});

// ── Kullanıcıya verilen puanlar ──────────────────────────────────────────────
app.get("/api/ratings/user/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  res.json(ratings.filter((r) => r.toUserId === userId));
});

// ── Tüm puanlar ─────────────────────────────────────────────────────────────
app.get("/api/ratings", (req, res) => {
  res.json(ratings);
});

// ── Tüm rezervasyonlar ──────────────────────────────────────────────────────
app.get("/api/reservations", (req, res) => {
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const pending = reservations.filter(
    (r) => r.status === "pending_approval",
  ).length;
  console.log(
    `[ReservationService] Liste → ${reservations.length} toplam (${confirmed} onaylı, ${pending} onay bekliyor)`,
  );
  res.json(reservations);
});

function logStats() {
  const confirmed = reservations.filter((r) => r.status === "confirmed").length;
  const pending = reservations.filter(
    (r) => r.status === "pending_approval",
  ).length;
  console.log(
    `   Toplam: ${reservations.length} (${confirmed} onaylı, ${pending} onay bekliyor)`,
  );
}

if (require.main === module) {
  app.listen(3003, () => {
    const confirmed = reservations.filter(
      (r) => r.status === "confirmed",
    ).length;
    const pending = reservations.filter(
      (r) => r.status === "pending_approval",
    ).length;
    console.log("✅ Reservation Service → http://localhost:3003");
    console.log(
      `   ${reservations.length} rezervasyon | ${confirmed} onaylı | ${pending} onay bekliyor | Puanlama sistemi aktif`,
    );
  });
}

module.exports = app;
