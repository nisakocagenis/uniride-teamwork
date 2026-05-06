const request = require("supertest");
const app = require("./index");

describe("Vehicle Service API", () => {
  test("GET /api/vehicles returns vehicle list", async () => {
    const response = await request(app).get("/api/vehicles");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("GET /api/vehicles/:id returns one vehicle", async () => {
    const listResponse = await request(app).get("/api/vehicles");
    const firstVehicle = listResponse.body[0];

    const response = await request(app).get(`/api/vehicles/${firstVehicle.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", firstVehicle.id);
    expect(response.body).toHaveProperty("brand");
    expect(response.body).toHaveProperty("model");
  });

  test("GET /api/vehicles/:id returns 404 for missing vehicle", async () => {
    const response = await request(app).get("/api/vehicles/999999");

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error", "Araç bulunamadı.");
  });

  test("POST /api/vehicles creates a new vehicle", async () => {
    const response = await request(app).post("/api/vehicles").send({
      brand: "Ford",
      model: "Focus",
      segment: "Economy",
      pricePerDay: 200,
      campus: "Yaşar Üniversitesi",
      ownerId: 2,
      image: "test-car.jpg",
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("brand", "Ford");
    expect(response.body).toHaveProperty("available", true);
    expect(response.body).toHaveProperty("archived", false);
  });

  test("PATCH /api/vehicles/:id/availability updates availability", async () => {
    const createResponse = await request(app).post("/api/vehicles").send({
      brand: "Opel",
      model: "Corsa",
      segment: "Economy",
      pricePerDay: 180,
      campus: "Ege Üniversitesi",
      ownerId: 2,
    });

    const vehicleId = createResponse.body.id;

    const response = await request(app)
      .patch(`/api/vehicles/${vehicleId}/availability`)
      .send({ available: false });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("available", false);
  });

  test("PUT /api/vehicles/:id updates vehicle information", async () => {
    const createResponse = await request(app).post("/api/vehicles").send({
      brand: "Hyundai",
      model: "i20",
      segment: "Economy",
      pricePerDay: 160,
      campus: "Yaşar Üniversitesi",
      ownerId: 2,
    });

    const vehicleId = createResponse.body.id;

    const response = await request(app).put(`/api/vehicles/${vehicleId}`).send({
      brand: "Hyundai",
      model: "i30",
      pricePerDay: 220,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("model", "i30");
    expect(response.body).toHaveProperty("pricePerDay", 220);
  });

  test("PATCH /api/vehicles/:id/archive toggles archived status", async () => {
    const createResponse = await request(app).post("/api/vehicles").send({
      brand: "Fiat",
      model: "Egea",
      segment: "Standard",
      pricePerDay: 190,
      campus: "Yaşar Üniversitesi",
      ownerId: 2,
    });

    const vehicleId = createResponse.body.id;

    const response = await request(app).patch(
      `/api/vehicles/${vehicleId}/archive`,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("archived", true);
  });

  test("DELETE /api/vehicles/:id deletes available vehicle", async () => {
    const createResponse = await request(app).post("/api/vehicles").send({
      brand: "Test",
      model: "Delete",
      segment: "Economy",
      pricePerDay: 100,
      campus: "Yaşar Üniversitesi",
      ownerId: 2,
    });

    const vehicleId = createResponse.body.id;

    const response = await request(app).delete(`/api/vehicles/${vehicleId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true });
  });
});
