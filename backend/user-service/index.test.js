const request = require("supertest");
const app = require("./index");

describe("User Service API", () => {
  test("POST /api/login returns token and user for valid credentials", async () => {
    const response = await request(app).post("/api/login").send({
      username: "yaren.kaya@stu.ege.edu.tr",
      password: "123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("token");
    expect(response.body).toHaveProperty("user");
    expect(response.body.user).toHaveProperty(
      "username",
      "yaren.kaya@stu.ege.edu.tr",
    );
    expect(response.body.user).not.toHaveProperty("password");
  });

  test("POST /api/login returns 401 for invalid credentials", async () => {
    const response = await request(app).post("/api/login").send({
      username: "wrong@example.com",
      password: "wrong",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("error");
  });

  test("GET /api/users/:id returns user without password", async () => {
    const response = await request(app).get("/api/users/1");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", 1);
    expect(response.body).toHaveProperty("name");
    expect(response.body).not.toHaveProperty("password");
  });

  test("GET /api/users/:id returns 404 for missing user", async () => {
    const response = await request(app).get("/api/users/999");

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  test("GET /api/verify returns 401 when authorization header is missing", async () => {
    const response = await request(app).get("/api/verify");

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ valid: false });
  });

  test("GET /api/verify returns 401 for invalid token", async () => {
    const response = await request(app)
      .get("/api/verify")
      .set("Authorization", "Bearer invalid_token");

    expect(response.statusCode).toBe(401);
    expect(response.body).toEqual({ valid: false });
  });

  test("GET /api/verify returns valid user for correct token", async () => {
    const loginResponse = await request(app).post("/api/login").send({
      username: "cagri.kaya@stu.yasar.edu.tr",
      password: "123",
    });

    const token = loginResponse.body.token;

    const verifyResponse = await request(app)
      .get("/api/verify")
      .set("Authorization", `Bearer ${token}`);

    expect(verifyResponse.statusCode).toBe(200);
    expect(verifyResponse.body).toHaveProperty("valid", true);
    expect(verifyResponse.body).toHaveProperty("user");
    expect(verifyResponse.body.user).not.toHaveProperty("password");
  });

  test("POST /api/logout returns success even without token", async () => {
    const response = await request(app).post("/api/logout");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  test("POST /api/logout removes active token", async () => {
    const loginResponse = await request(app).post("/api/login").send({
      username: "yaren.kaya@stu.ege.edu.tr",
      password: "123",
    });

    const token = loginResponse.body.token;

    const logoutResponse = await request(app)
      .post("/api/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutResponse.statusCode).toBe(200);
    expect(logoutResponse.body).toEqual({ success: true });

    const verifyAfterLogout = await request(app)
      .get("/api/verify")
      .set("Authorization", `Bearer ${token}`);

    expect(verifyAfterLogout.statusCode).toBe(401);
    expect(verifyAfterLogout.body).toEqual({ valid: false });
  });

  test("POST /api/register returns 400 when required fields are missing", async () => {
    const response = await request(app)
      .post("/api/register")
      .field("username", "newuser@example.com");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error", "All fields are required.");
  });

  test("POST /api/register returns 400 for invalid role", async () => {
    const response = await request(app)
      .post("/api/register")
      .field("username", "newuser@example.com")
      .field("password", "123456")
      .field("name", "New User")
      .field("role", "driver")
      .field("university", "Yaşar Üniversitesi");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error", "Invalid role.");
  });

  test("POST /api/register returns 400 for invalid email", async () => {
    const response = await request(app)
      .post("/api/register")
      .field("username", "invalid-email")
      .field("password", "123456")
      .field("name", "New User")
      .field("role", "renter")
      .field("university", "Yaşar Üniversitesi");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Please enter a valid email address.",
    );
  });

  test("POST /api/register returns 400 for short password", async () => {
    const response = await request(app)
      .post("/api/register")
      .field("username", "newuser@example.com")
      .field("password", "123")
      .field("name", "New User")
      .field("role", "renter")
      .field("university", "Yaşar Üniversitesi");

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "Password must be at least 6 characters.",
    );
  });

  test("POST /api/register returns 409 for already registered email", async () => {
    const response = await request(app)
      .post("/api/register")
      .field("username", "yaren.kaya@stu.ege.edu.tr")
      .field("password", "123456")
      .field("name", "Yaren Kaya")
      .field("role", "renter")
      .field("university", "Ege Üniversitesi");

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty(
      "error",
      "This email address is already registered.",
    );
  });
});
