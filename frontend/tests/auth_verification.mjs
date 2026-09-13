import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";

function postJson(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: body });
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "Accept": "application/json",
        ...headers,
      },
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, rawBody: body });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

describe("Strict Authentication & Authorization Verification", () => {
  let adminPwd = "";
  let dutyPwd = "";
  let auditPwd = "";
  let publicPwd = "";

  test("Read secure credentials from local uncommitted seed file", () => {
    const creds = fs.readFileSync("../backend/.env.seed_credentials", "utf-8");
    for (const line of creds.split("\n")) {
      if (line.startsWith("ADMIN_FAISAL_PASSWORD=")) adminPwd = line.trim().split("=")[1];
      if (line.startsWith("SI_NUSRAT_PASSWORD=")) dutyPwd = line.trim().split("=")[1];
      if (line.startsWith("SYSTEM_AUDITOR_PASSWORD=")) auditPwd = line.trim().split("=")[1];
      if (line.startsWith("COMPLAINANT_RAHIM_PASSWORD=")) publicPwd = line.trim().split("=")[1];
    }
    assert.ok(adminPwd.length > 0, "Admin password present in local seed config");
    assert.ok(dutyPwd.length > 0, "Duty officer password present in local seed config");
  });

  // Test 1: Anonymous visitor to /dashboard is redirected
  test("1. Anonymous visitor opens /dashboard -> 307 Redirect to /login", async () => {
    const res = await getJson("http://localhost:7700/dashboard");
    assert.strictEqual(res.status, 307);
    assert.ok(res.headers.location.includes("/login?redirect="));
  });

  // Test 2: Anonymous visitor to /cases/1 is redirected
  test("2. Anonymous visitor opens /cases/1 -> 307 Redirect to /login", async () => {
    const res = await getJson("http://localhost:7700/cases/1");
    assert.strictEqual(res.status, 307);
    assert.ok(res.headers.location.includes("/login?redirect="));
  });

  // Test 3: Anonymous visitor to /admin/users is redirected
  test("3. Anonymous visitor opens /admin/users -> 307 Redirect to /login", async () => {
    const res = await getJson("http://localhost:7700/admin/users");
    assert.strictEqual(res.status, 307);
    assert.ok(res.headers.location.includes("/login?redirect="));
  });

  // Test 4: Valid officer logs in
  test("4. Valid officer logs in -> 200 OK & Sets HttpOnly Session Cookie", async () => {
    const res = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "admin_faisal",
      password: adminPwd,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.user.username, "admin_faisal");

    const cookies = res.headers["set-cookie"];
    assert.ok(cookies && cookies.length > 0, "Set-Cookie header must be received");
    const cookieStr = cookies[0];
    assert.ok(cookieStr.includes("orcus_auth_token="), "Session cookie name must be orcus_auth_token");
    assert.ok(cookieStr.toLowerCase().includes("httponly"), "Cookie must be marked HttpOnly");
  });

  // Test 5: Invalid password rejected
  test("5. Invalid password is rejected -> 401 Unauthorized", async () => {
    const res = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "admin_faisal",
      password: "WrongPassword123!",
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // Test 6: Unknown / disabled account rejected
  test("6. Unknown or disabled account is rejected -> 401 Unauthorized", async () => {
    const res = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "nonexistent_officer_999",
      password: "SomePassword123!",
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  // Test 7: Logout clears the authentication cookie
  test("7. Logout clears authentication cookie -> 200 OK & Expired Cookie", async () => {
    const res = await postJson("http://localhost:5050/api/v1/auth/logout", {});
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const cookies = res.headers["set-cookie"];
    assert.ok(cookies && cookies.length > 0);
    const cookieStr = cookies[0];
    assert.ok(
      cookieStr.includes("Max-Age=0") || cookieStr.includes("expires="),
      "Logout must expire the cookie"
    );
  });

  // Test 8: Public complainant cannot enter officer operational endpoints
  test("8. Public user cannot access officer portal operational endpoints -> 403 Forbidden", async () => {
    const loginRes = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "complainant_rahim",
      password: publicPwd,
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    // Try to access internal branches list
    const branchRes = await getJson("http://localhost:5050/api/v1/branches", { Cookie: cookie });
    assert.strictEqual(branchRes.status, 403, "Public user must be 403 blocked from branches");

    // Try to access cases list
    const casesRes = await getJson("http://localhost:5050/api/v1/cases", { Cookie: cookie });
    assert.strictEqual(casesRes.status, 403, "Public user must be 403 blocked from cases");
  });

  // Test 9: Non-admin cannot access admin audit logs
  test("9. Non-admin (Duty Officer) cannot access admin audit logs -> 403 Forbidden", async () => {
    const loginRes = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "si_nusrat",
      password: dutyPwd,
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    const auditRes = await getJson("http://localhost:5050/api/v1/admin/audit-logs", { Cookie: cookie });
    assert.strictEqual(auditRes.status, 403, "Duty officer must be 403 forbidden from audit logs");
  });

  // Test 10: Auditor cannot perform write operations
  test("10. System Auditor cannot perform write operations (create branch) -> 403 Forbidden", async () => {
    const loginRes = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "system_auditor",
      password: auditPwd,
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    const createBranchRes = await postJson("http://localhost:5050/api/v1/branches", {
      branch_name: "Unauthorized Auditor Branch",
      district: "Dhaka",
    }, { Cookie: cookie });
    assert.strictEqual(createBranchRes.status, 403, "Auditor must be 403 forbidden from creating branches");
  });

  // Test 11: Logged-out user cannot reuse previous or cleared session
  test("11. Logged-out user cannot reuse previous session -> 401 Unauthorized", async () => {
    // 1. Log in
    const loginRes = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "admin_faisal",
      password: adminPwd,
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    // 2. Log out
    const logoutRes = await postJson("http://localhost:5050/api/v1/auth/logout", {}, { Cookie: cookie });
    assert.strictEqual(logoutRes.status, 200);

    // 3. Re-request protected endpoint with expired cookie
    const expiredCookie = logoutRes.headers["set-cookie"][0].split(";")[0];
    const meRes = await getJson("http://localhost:5050/api/v1/auth/me", { Cookie: expiredCookie });
    assert.strictEqual(meRes.status, 401, "Expired cookie must be rejected with 401");
  });

  // Test 12: Forged or corrupted cookie is rejected
  test("12. Forged or expired JWT cookie is rejected -> 401 Unauthorized", async () => {
    const forgedCookie = "orcus_auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature";
    const res = await getJson("http://localhost:5050/api/v1/auth/me", { Cookie: forgedCookie });
    assert.strictEqual(res.status, 401, "Forged token must return 401");
  });

  // Test 13: Evidence Officer cannot alter complaint assessments
  test("13. Evidence Officer cannot alter complaint assessments -> 403 Forbidden", async () => {
    // Login as Evidence Officer
    const creds = fs.readFileSync("../backend/.env.seed_credentials", "utf-8");
    let evidencePwd = "";
    for (const line of creds.split("\n")) {
      if (line.startsWith("FORENSIC_LIZA_PASSWORD=")) evidencePwd = line.trim().split("=")[1];
    }
    const loginRes = await postJson("http://localhost:5050/api/v1/auth/login", {
      username: "forensic_liza",
      password: evidencePwd,
    });
    assert.strictEqual(loginRes.status, 200);
    const cookie = loginRes.headers["set-cookie"][0].split(";")[0];

    const assessRes = await postJson("http://localhost:5050/api/v1/complaints/1/assess", {
      new_status: "Verified",
      decision: "ILLEGAL_ACTION",
      reason: "Attempt by unauthorized evidence officer",
    }, { Cookie: cookie });
    assert.strictEqual(assessRes.status, 403, "Evidence Officer must receive 403 when trying to assess complaint");
  });

  // Test 14: Storage inspection: No secrets, passwords, or JWTs stored in client storage
  test("14. Client-side storage audit: No JWT, passwords, or tokens in localStorage or sessionStorage", () => {
    const srcDir = "./src";
    function scanDir(dir) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const f of files) {
        const full = `${dir}/${f.name}`;
        if (f.isDirectory()) {
          scanDir(full);
        } else if (f.name.endsWith(".ts") || f.name.endsWith(".tsx") || f.name.endsWith(".js")) {
          const content = fs.readFileSync(full, "utf-8");
          assert.ok(!content.includes("localStorage.setItem('jwt'"), `No JWT in localStorage in ${full}`);
          assert.ok(!content.includes("localStorage.setItem('token'"), `No token in localStorage in ${full}`);
          assert.ok(!content.includes("localStorage.setItem('password'"), `No password in localStorage in ${full}`);
          assert.ok(!content.includes("sessionStorage.setItem('jwt'"), `No JWT in sessionStorage in ${full}`);
          assert.ok(!content.includes("sessionStorage.setItem('token'"), `No token in sessionStorage in ${full}`);
          assert.ok(!content.includes("sessionStorage.setItem('password'"), `No password in sessionStorage in ${full}`);
        }
      }
    }
    scanDir(srcDir);
  });

  // Test 15: Client-Side Session Tampering Protection
  test("15. Client-Side Session Tampering Protection Contract", () => {
    const apiFile = fs.readFileSync("./src/lib/api.ts", "utf-8");
    assert.ok(apiFile.includes('credentials: "include"'), "Requests must rely on server-validated credentials");
    assert.ok(!apiFile.includes("localStorage.getItem('token')"), "No client token override");
  });
});
