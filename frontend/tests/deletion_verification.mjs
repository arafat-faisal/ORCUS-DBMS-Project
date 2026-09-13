// ============================================================================
// Deletion Capabilities Verification Test
// Tests: Delete User (with root admin protection), Case, Complaint, Evidence, GD, FIR
// ============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_CREDS_FILE = path.resolve(__dirname, "../../backend/.env.seed_credentials");

const BASE_URL = process.env.TEST_API_URL || "http://127.0.0.1:5050/api/v1";

function readAdminCredentials() {
  const content = fs.readFileSync(SEED_CREDS_FILE, "utf-8");
  let password = "";
  for (const line of content.split("\n")) {
    if (line.startsWith("ADMIN_FAISAL_PASSWORD=")) {
      password = line.trim().split("=")[1];
    }
  }
  return { username: "admin_faisal", password };
}

test("Record Deletion Capabilities Test Suite", async (t) => {
  const adminCreds = readAdminCredentials();

  // 1. Authenticate as Admin
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: adminCreds.username,
      password: adminCreds.password,
    }),
  });
  assert.equal(loginRes.status, 200, "Admin login must succeed");
  const cookie = loginRes.headers.get("set-cookie") || "";
  const authHeaders = {
    Cookie: cookie,
    "Content-Type": "application/json",
  };

  await t.test("Safeguard: Root Admin (user_id = 1) cannot be deleted", async () => {
    const res = await fetch(`${BASE_URL}/users/1`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(res.status, 403, "Deleting root admin must return 403 Forbidden");
    const data = await res.json();
    assert.equal(data.success, false);
    assert.match(data.error, /cannot be deleted/i);
  });

  await t.test("Delete User: Create temporary user and delete it", async () => {
    // Create test user
    const uniqueUser = `test_del_${Date.now()}`;
    const createRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        username: uniqueUser,
        password: "TemporaryPassword123!",
        role_ids: [2],
      }),
    });
    assert.equal(createRes.status, 201, "Test user creation should succeed");
    const created = await createRes.json();
    const newUserId = created.data.user_id;

    // Delete user
    const delRes = await fetch(`${BASE_URL}/users/${newUserId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delRes.status, 200, "Deleting created user should succeed");
    const delData = await delRes.json();
    assert.equal(delData.success, true);

    // Verify user is gone from list
    const listRes = await fetch(`${BASE_URL}/users`, { headers: authHeaders });
    const listData = await listRes.json();
    const found = listData.data.some((u) => u.user_id === newUserId);
    assert.equal(found, false, "Deleted user should not appear in users list");
  });

  await t.test("Delete Complaint: Create test complaint and delete it", async () => {
    // Create complainant first
    const compRes = await fetch(`${BASE_URL}/complainants`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Deletion Test Citizen",
        contacts: [{ contact_type: "Phone", contact_value: "01799887766", is_primary: true }],
      }),
    });
    assert.equal(compRes.status, 201);
    const compData = await compRes.json();
    const complainantId = compData.data.complainant_id;

    // Create complaint
    const createCompRes = await fetch(`${BASE_URL}/complaints`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Test Complaint To Be Deleted",
        description: "This complaint is created specifically to verify deletion.",
        complainant_id: complainantId,
        receiving_branch_id: 1,
        incident_date: "2026-09-10",
        submission_channel: "In-Person",
        urgency: "Low",
      }),
    });
    assert.equal(createCompRes.status, 201);
    const newComplaint = await createCompRes.json();
    const complaintId = newComplaint.data.complaint_id;

    // Delete complaint
    const delCompRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delCompRes.status, 200, "Complaint deletion should return 200 OK");
    const delData = await delCompRes.json();
    assert.equal(delData.success, true);

    // Verify complaint detail returns 404
    const getRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, { headers: authHeaders });
    assert.equal(getRes.status, 404, "Deleted complaint detail should return 404");
  });

  await t.test("Delete Evidence and Case: Create case, add evidence, delete evidence, then delete case", async () => {
    // 1. Create case directly
    const caseRes = await fetch(`${BASE_URL}/cases`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        case_title: "Case Created For Deletion Test",
        opened_date: "2026-09-10",
        lead_officer_id: 1,
      }),
    });
    assert.equal(caseRes.status, 201, "Case creation should return 201");
    const caseData = await caseRes.json();
    const caseId = caseData.data.case_id;

    // 2. Create evidence item
    const evidRes = await fetch(`${BASE_URL}/evidence`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        case_id: caseId,
        title: "Temporary Test Knife Evidence",
        description: "Found at test site for deletion verification.",
        evidence_type: "Physical",
        collected_by_officer_id: 1,
        storage_location: "Locker Room B",
      }),
    });
    assert.equal(evidRes.status, 201, "Evidence creation should return 201");
    const evidData = await evidRes.json();
    const evidenceId = evidData.data.evidence_id;

    // 3. Delete evidence item
    const delEvidRes = await fetch(`${BASE_URL}/evidence/${evidenceId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delEvidRes.status, 200, "Evidence deletion should return 200");
    const delEvidData = await delEvidRes.json();
    assert.equal(delEvidData.success, true);

    // Verify evidence detail returns 500 or error / not found
    const getEvidRes = await fetch(`${BASE_URL}/evidence/${evidenceId}`, { headers: authHeaders });
    assert.ok(getEvidRes.status === 404 || getEvidRes.status === 500);

    // 4. Delete the case
    const delCaseRes = await fetch(`${BASE_URL}/cases/${caseId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delCaseRes.status, 200, "Case deletion should return 200");
    const delCaseData = await delCaseRes.json();
    assert.equal(delCaseData.success, true);

    // Verify case is not returned in dossier
    const getCaseRes = await fetch(`${BASE_URL}/cases/${caseId}`, { headers: authHeaders });
    assert.ok(getCaseRes.status === 404 || getCaseRes.status === 500);
  });

  await t.test("Delete GD: Create General Diary and delete it", async () => {
    // 0. Create complainant
    const compRes = await fetch(`${BASE_URL}/complainants`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "GD Test Citizen",
        contacts: [{ contact_type: "Phone", contact_value: "01811223344", is_primary: true }],
      }),
    });
    assert.equal(compRes.status, 201);
    const compData = await compRes.json();
    const compId = compData.data.complainant_id;

    // 1. Create GD
    const createRes = await fetch(`${BASE_URL}/gds`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        subject: "Temporary GD for deletion test",
        incident_place: "Chittagong Port Area",
        gd_date: "2026-09-11",
        branch_id: 1,
        complainant_id: compId,
      }),
    });
    assert.equal(createRes.status, 201, "GD creation should return 201");
    const gdData = await createRes.json();
    const gdId = gdData.data.gd_id;

    // 2. Delete GD
    const delRes = await fetch(`${BASE_URL}/gds/${gdId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delRes.status, 200, "GD deletion should return 200");
    const delData = await delRes.json();
    assert.equal(delData.success, true);
  });

  await t.test("Delete FIR: Create FIR and delete it", async () => {
    // 1. Create FIR
    const createRes = await fetch(`${BASE_URL}/firs`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        crime_category: "Extortion",
        place_of_occurrence: "Agrabad Commercial Area",
        incident_date: "2026-09-10",
        branch_id: 1,
        section_ids: [1],
        complainant: {
          name: "FIR Test Informant",
          contacts: [{ contact_type: "Phone", contact_value: "01755667788", is_primary: true }],
        },
      }),
    });
    assert.equal(createRes.status, 201, "FIR creation should return 201");
    const firData = await createRes.json();
    const firId = firData.data.fir_id;

    // 2. Delete FIR
    const delRes = await fetch(`${BASE_URL}/firs/${firId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    assert.equal(delRes.status, 200, "FIR deletion should return 200");
    const delData = await delRes.json();
    assert.equal(delData.success, true);
  });
});
