const request = require("supertest");
const app = require("./index");

describe("Payment Service API", () => {
  test("POST /api/pay returns successful payment response", async () => {
    const response = await request(app).post("/api/pay").send({
      userId: 1,
      amount: 250,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("transactionId");
    expect(response.body).toHaveProperty("amount", 250);
    expect(response.body).toHaveProperty("message", "Ödeme başarıyla işlendi.");
  });

  test("POST /api/pay creates a transaction id with TXN prefix", async () => {
    const response = await request(app).post("/api/pay").send({
      userId: 2,
      amount: 500,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.transactionId).toMatch(/^TXN_/);
  });
});
