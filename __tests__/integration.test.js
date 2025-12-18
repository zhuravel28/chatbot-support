import request from "supertest";
import app from "../server.js";

describe("Integration test: health API", () => {
  test("GET /history without token returns 401", async () => {
    const res = await request(app).get("/history");
    expect(res.status).toBe(401);
  });
});
