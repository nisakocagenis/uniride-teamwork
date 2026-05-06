const request = require("supertest");

jest.mock("node-fetch", () => jest.fn());

const fetch = require("node-fetch");
const app = require("./index");

describe("Reservation Service API", () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  test("GET /api/reservations returns reservation list", async () => {
    const response = await request(app).get("/api/reservations");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/reservations creates reservation when vehicle is available and payment succeeds", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          id: 1,
          brand: "Toyota",
          model: "Corolla",
          available: true,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          transactionId: "TXN_TEST_123",
        }),
      });

    const response = await request(app)
      .post("/api/reservations")
      .send({
        userId: 1,
        renterName: "Yaren Kaya",
        vehicleId: 1,
        startDate: "2026-05-10",
        endDate: "2026-05-12",
        amount: 500,
        cardInfo: {
          cardNumber: "4111111111111111",
          name: "Yaren Kaya",
        },
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("status", "pending_approval");
    expect(response.body).toHaveProperty("transactionId", "TXN_TEST_123");
  });

  test("POST /api/reservations returns 400 when vehicle is not available", async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({
        id: 1,
        brand: "Toyota",
        model: "Corolla",
        available: false,
      }),
    });

    const response = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 1,
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      amount: 500,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Bu araç şu an müsait değil.",
    );
  });

  test("POST /api/reservations returns 400 when payment fails", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          id: 2,
          brand: "Honda",
          model: "Civic",
          available: true,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: false,
        }),
      });

    const response = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 2,
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      amount: 700,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error", "Ödeme işlemi başarısız.");
  });

  test("POST /api/reservations returns 500 when external service fails", async () => {
    fetch.mockRejectedValueOnce(new Error("Vehicle service unavailable"));

    const response = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 1,
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      amount: 500,
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty(
      "error",
      "Servis hatası. Lütfen tekrar deneyin.",
    );
  });

  test("PATCH /api/reservations/:id/approve approves pending reservation", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          id: 3,
          brand: "Ford",
          model: "Focus",
          available: true,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          transactionId: "TXN_APPROVE_123",
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          available: false,
        }),
      });

    const createResponse = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 3,
      startDate: "2026-05-10",
      endDate: "2026-05-12",
      amount: 600,
    });

    const reservationId = createResponse.body.id;

    const approveResponse = await request(app).patch(
      `/api/reservations/${reservationId}/approve`,
    );

    expect(approveResponse.statusCode).toBe(200);
    expect(approveResponse.body).toHaveProperty("status", "confirmed");
  });

  test("PATCH /api/reservations/:id/approve returns 404 for missing reservation", async () => {
    const response = await request(app).patch(
      "/api/reservations/999999/approve",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Rezervasyon bulunamadı.");
  });

  test("PATCH /api/reservations/:id/reject rejects pending reservation", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          id: 10,
          brand: "Renault",
          model: "Clio",
          available: true,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          transactionId: "TXN_REJECT_123",
        }),
      });

    const createResponse = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 10,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      amount: 450,
    });

    const reservationId = createResponse.body.id;

    const rejectResponse = await request(app).patch(
      `/api/reservations/${reservationId}/reject`,
    );

    expect(rejectResponse.statusCode).toBe(200);
    expect(rejectResponse.body).toHaveProperty("status");
    expect(["rejected", "cancelled", "canceled"]).toContain(
      rejectResponse.body.status,
    );
  });

  test("PATCH /api/reservations/:id/reject returns 404 for missing reservation", async () => {
    const response = await request(app).patch(
      "/api/reservations/999999/reject",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Rezervasyon bulunamadı.");
  });

  test("PATCH /api/reservations/:id/cancel cancels reservation", async () => {
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          id: 11,
          brand: "Peugeot",
          model: "208",
          available: true,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          transactionId: "TXN_CANCEL_123",
        }),
      });

    const createResponse = await request(app).post("/api/reservations").send({
      userId: 1,
      renterName: "Yaren Kaya",
      vehicleId: 11,
      startDate: "2026-06-05",
      endDate: "2026-06-06",
      amount: 300,
    });

    const reservationId = createResponse.body.id;

    const cancelResponse = await request(app).patch(
      `/api/reservations/${reservationId}/cancel`,
    );

    expect(cancelResponse.statusCode).toBe(200);
    expect(cancelResponse.body).toHaveProperty("status");
    expect(["cancelled", "canceled"]).toContain(cancelResponse.body.status);
  });

  test("PATCH /api/reservations/:id/cancel returns 404 for missing reservation", async () => {
    const response = await request(app).patch(
      "/api/reservations/999999/cancel",
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Rezervasyon bulunamadı.");
  });

  test("POST /api/ratings creates a rating", async () => {
    const response = await request(app).post("/api/ratings").send({
      reservationId: 100,
      fromUserId: 1,
      fromName: "Yaren Kaya",
      toUserId: 2,
      stars: 5,
      comment: "Great experience",
      type: "renter-to-owner",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("stars", 5);
    expect(response.body).toHaveProperty("comment", "Great experience");
  });

  test("POST /api/ratings prevents duplicate rating", async () => {
    await request(app).post("/api/ratings").send({
      reservationId: 101,
      fromUserId: 1,
      fromName: "Yaren Kaya",
      toUserId: 2,
      stars: 4,
      type: "renter-to-owner",
    });

    const response = await request(app).post("/api/ratings").send({
      reservationId: 101,
      fromUserId: 1,
      fromName: "Yaren Kaya",
      toUserId: 2,
      stars: 3,
      type: "renter-to-owner",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Bu rezervasyon için zaten puan verdiniz.",
    );
  });

  test("GET /api/ratings returns ratings list", async () => {
    const response = await request(app).get("/api/ratings");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /api/ratings/user/:userId returns ratings for user", async () => {
    const response = await request(app).get("/api/ratings/user/2");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
