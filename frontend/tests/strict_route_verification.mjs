import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";

function fetchRoute(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "Accept": "text/html,application/json",
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          location: res.headers.location || "",
          body,
        });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function login(username, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ username, password });
    const req = http.request({
      hostname: "localhost",
      port: 5050,
      path: "/api/v1/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        const cookies = res.headers["set-cookie"];
        const cookie = cookies && cookies.length > 0 ? cookies[0].split(";")[0] : "";
        resolve({ status: res.statusCode, cookie });
      });
    });
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

describe("Strict Route Verification Suite", () => {
  let adminPwd = "";
  let dutyPwd = "";
  let publicPwd = "";

  let adminCookie = "";
  let dutyCookie = "";
  let publicCookie = "";

  test("0. Setup test session cookies from seed credentials", async () => {
    const creds = fs.readFileSync("../backend/.env.seed_credentials", "utf-8");
    for (const line of creds.split("\n")) {
      if (line.startsWith("ADMIN_FAISAL_PASSWORD=")) adminPwd = line.trim().split("=")[1];
      if (line.startsWith("SI_NUSRAT_PASSWORD=")) dutyPwd = line.trim().split("=")[1];
      if (line.startsWith("COMPLAINANT_RAHIM_PASSWORD=")) publicPwd = line.trim().split("=")[1];
    }

    const aRes = await login("admin_faisal", adminPwd);
    assert.strictEqual(aRes.status, 200);
    adminCookie = aRes.cookie;

    const dRes = await login("si_nusrat", dutyPwd);
    assert.strictEqual(dRes.status, 200);
    dutyCookie = dRes.cookie;

    const pRes = await login("complainant_rahim", publicPwd);
    assert.strictEqual(pRes.status, 200);
    publicCookie = pRes.cookie;
  });

  // Group 1: Public Routes (Expected 200)
  const publicRoutes = [
    { route: "/", content: "ORCUS" },
    { route: "/login", content: "Username" },
    { route: "/public/complaints/new", content: "Citizen" },
    { route: "/public/complaints/track", content: "Track" },
  ];

  for (const pr of publicRoutes) {
    test(`Public Route: ${pr.route} returns 200 OK`, async () => {
      const res = await fetchRoute(`http://localhost:7700${pr.route}`);
      assert.strictEqual(res.status, 200, `Public route ${pr.route} must return 200`);
      assert.ok(res.body.includes(pr.content), `Route ${pr.route} must include '${pr.content}'`);
    });
  }

  // Group 2: Unauthenticated Protected Routes (Expected 307 Redirect to /login)
  const protectedRoutes = [
    "/dashboard",
    "/complaints",
    "/complaints/new",
    "/gd",
    "/fir",
    "/cases",
    "/cases/new",
    "/participants",
    "/evidence",
    "/evidence/new",
    "/search",
    "/reports",
    "/profile",
    "/admin/users",
    "/admin/roles",
    "/admin/branches",
    "/admin/audit-logs",
    "/admin/settings",
  ];

  for (const r of protectedRoutes) {
    test(`Unauthenticated Protected: ${r} -> 307 Redirect to /login`, async () => {
      const res = await fetchRoute(`http://localhost:7700${r}`);
      assert.strictEqual(res.status, 307, `Unauthenticated ${r} must return 307 Redirect`);
      assert.ok(
        res.location.startsWith("/login?redirect=") || res.location === "/login",
        `Redirect location must point to login (got ${res.location})`
      );
    });
  }

  // Group 3: Authenticated Protected Routes (Expected 200 OK with session cookie)
  for (const r of protectedRoutes) {
    test(`Authenticated (Admin): ${r} returns 200 OK`, async () => {
      const res = await fetchRoute(`http://localhost:7700${r}`, { Cookie: adminCookie });
      assert.strictEqual(res.status, 200, `Authenticated ${r} must return 200 OK`);
      assert.ok(!res.body.includes("Internal Server Error"), `Route ${r} must not throw 500 error`);
    });
  }

  // Group 4: Nonexistent dynamic records (Expected 200 with safe unavailable message, or 404)
  test("Nonexistent Complaint detail: /complaints/999999 returns safe page shell without crashing", async () => {
    const res = await fetchRoute("http://localhost:7700/complaints/999999", { Cookie: adminCookie });
    assert.strictEqual(res.status, 200);
    assert.ok(!res.body.includes("Internal Server Error"), "Must not crash or 500");
  });

  test("Nonexistent Case detail: /cases/999999 returns safe page shell without crashing", async () => {
    const res = await fetchRoute("http://localhost:7700/cases/999999", { Cookie: adminCookie });
    assert.strictEqual(res.status, 200);
    assert.ok(!res.body.includes("Internal Server Error"), "Must not crash or 500");
  });
});
