import { test, describe } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";

function request(url, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = payload ? JSON.stringify(payload) : null;
    const headers = {
      "Accept": "application/json",
      ...(options.headers || {}),
    };
    if (postData) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: options.method || "GET",
      headers,
    }, (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(body); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw: body });
      });
    });
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

describe("Deterministic Core Investigation Workflow (End-to-End)", () => {
  let adminPwd = "";
  let dutyPwd = "";
  let oicPwd = "";
  let investigatorPwd = "";
  let evidencePwd = "";

  let dutyCookie = "";
  let oicCookie = "";
  let investigatorCookie = "";
  let evidenceCookie = "";

  let testTrackingCode = "";
  let testComplaintId = 0;
  let testGDId = 0;
  let testGDNumber = "";
  let testFIRId = 0;
  let testFIRNumber = "";
  let testCaseId = 0;
  let testEvidenceId = 0;

  test("0. Setup and authenticate actors from seed credentials", async () => {
    const creds = fs.readFileSync("../backend/.env.seed_credentials", "utf-8");
    for (const line of creds.split("\n")) {
      if (line.startsWith("ADMIN_FAISAL_PASSWORD=")) adminPwd = line.trim().split("=")[1];
      if (line.startsWith("SI_NUSRAT_PASSWORD=")) dutyPwd = line.trim().split("=")[1];
      if (line.startsWith("INSP_TARIQ_PASSWORD=")) oicPwd = line.trim().split("=")[1];
      if (line.startsWith("DET_SHAKIL_PASSWORD=")) investigatorPwd = line.trim().split("=")[1];
      if (line.startsWith("FORENSIC_LIZA_PASSWORD=")) evidencePwd = line.trim().split("=")[1];
    }

    // Authenticate Duty Officer
    const dRes = await request("http://localhost:5050/api/v1/auth/login", { method: "POST" }, {
      username: "si_nusrat", password: dutyPwd
    });
    assert.strictEqual(dRes.status, 200);
    dutyCookie = dRes.headers["set-cookie"][0].split(";")[0];

    // Authenticate OIC
    const oRes = await request("http://localhost:5050/api/v1/auth/login", { method: "POST" }, {
      username: "insp_tariq", password: oicPwd
    });
    assert.strictEqual(oRes.status, 200);
    oicCookie = oRes.headers["set-cookie"][0].split(";")[0];

    // Authenticate Investigator
    const iRes = await request("http://localhost:5050/api/v1/auth/login", { method: "POST" }, {
      username: "det_shakil", password: investigatorPwd
    });
    assert.strictEqual(iRes.status, 200);
    investigatorCookie = iRes.headers["set-cookie"][0].split(";")[0];

    // Authenticate Evidence Officer
    const eRes = await request("http://localhost:5050/api/v1/auth/login", { method: "POST" }, {
      username: "forensic_liza", password: evidencePwd
    });
    assert.strictEqual(eRes.status, 200);
    evidenceCookie = eRes.headers["set-cookie"][0].split(";")[0];
  });

  // Workflow A: Public Complaint Submission & Tracking
  test("Workflow A: Public Complaint Submission and Verification", async () => {
    const timestamp = Date.now();
    const payload = {
      complainant_name: `Academic Test Complainant ${timestamp}`,
      contact_phone: "01711223344",
      title: "Extortion and Threat by Organized Racket",
      description: "Fictional demonstration incident involving threatening letters at a commercial shop.",
      incident_date: "2026-09-10",
      incident_time: "14:30",
      receiving_branch_id: 1,
    };

    const submitRes = await request("http://localhost:5050/api/v1/public/complaints", { method: "POST" }, payload);
    assert.strictEqual(submitRes.status, 201, "Complaint submission must return 201 Created");
    assert.strictEqual(submitRes.body.success, true);
    assert.ok(submitRes.body.data.tracking_code, "Backend must generate authentic tracking code");
    
    testTrackingCode = submitRes.body.data.tracking_code;
    assert.match(testTrackingCode, /^CMP-/, "Tracking code must follow backend sequence prefix CMP-");

    // Track with valid credentials
    const trackRes = await request(`http://localhost:5050/api/v1/public/complaints/track?tracking_code=${testTrackingCode}&phone=01711223344`);
    assert.strictEqual(trackRes.status, 200);
    assert.strictEqual(trackRes.body.data.tracking_code, testTrackingCode);
    assert.strictEqual(trackRes.body.data.current_status, "Submitted");
    // Ensure sensitive internal notes are omitted from public track response
    assert.strictEqual(trackRes.body.data.internal_notes, undefined);

    // Track with invalid verification factor rejected
    const badTrackRes = await request(`http://localhost:5050/api/v1/public/complaints/track?tracking_code=${testTrackingCode}&phone=01900000000`);
    assert.strictEqual(badTrackRes.status, 404, "Mismatched verification factor must return 404");
  });

  // Workflow B: Officer Complaint Assessment
  test("Workflow B: Duty Officer Complaint Assessment", async () => {
    // Look up complaint_id by tracking code
    const listRes = await request(`http://localhost:5050/api/v1/complaints?search=${testTrackingCode}`, {
      headers: { Cookie: dutyCookie },
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.body.data && listRes.body.data.length > 0);
    testComplaintId = listRes.body.data[0].complaint_id;

    // Record formal assessment
    const assessPayload = {
      new_status: "Verified",
      decision: "VERIFY_AND_INVESTIGATE",
      reason: "Initial assessment confirms cognizable elements requiring inquiry.",
      public_status_message: "Your complaint has been verified by the Duty Officer.",
      internal_notes: "Checked CCTV footage at incident location.",
    };

    const assessRes = await request(`http://localhost:5050/api/v1/complaints/${testComplaintId}/assess`, {
      method: "POST",
      headers: { Cookie: dutyCookie },
    }, assessPayload);

    assert.strictEqual(assessRes.status, 200);
    assert.strictEqual(assessRes.body.success, true);

    // Verify history audit trail exists
    const histRes = await request(`http://localhost:5050/api/v1/complaints/${testComplaintId}/history`, {
      headers: { Cookie: dutyCookie },
    });
    assert.strictEqual(histRes.status, 200);
    assert.ok(histRes.body.data.length >= 2, "Must contain initial and assessed status history records");
  });

  // Workflow C: Complaint to General Diary (GD)
  test("Workflow C: Convert Complaint to General Diary (GD)", async () => {
    const gdPayload = {
      subject: "Extortion Threats - General Diary Inquiry",
      incident_place: "Shop 12, Mirpur Road, Dhaka",
    };

    const convertRes = await request(`http://localhost:5050/api/v1/complaints/${testComplaintId}/convert-gd`, {
      method: "POST",
      headers: { Cookie: dutyCookie },
    }, gdPayload);

    assert.strictEqual(convertRes.status, 201, "GD conversion must return 201 Created");
    assert.strictEqual(convertRes.body.success, true);
    assert.ok(convertRes.body.data.gd_id);
    assert.ok(convertRes.body.data.gd_number);

    testGDId = convertRes.body.data.gd_id;
    testGDNumber = convertRes.body.data.gd_number;
    assert.match(testGDNumber, /^GD-/, "GD number must follow backend sequence prefix GD-");

    // Verify duplicate conversion rejected
    const dupRes = await request(`http://localhost:5050/api/v1/complaints/${testComplaintId}/convert-gd`, {
      method: "POST",
      headers: { Cookie: dutyCookie },
    }, gdPayload);
    assert.ok(dupRes.status >= 400, "Duplicate conversion must return error status >= 400");
  });

  // Workflow D: GD to FIR Escalation
  test("Workflow D: Submit for FIR Registration Review and Register FIR", async () => {
    const firPayload = {
      crime_category: "EXTORTION",
      filed_date: "2026-09-12",
      section_ids: [1, 2],
    };

    // OIC registers FIR from GD
    const linkRes = await request(`http://localhost:5050/api/v1/gds/${testGDId}/link-fir`, {
      method: "POST",
      headers: { Cookie: oicCookie },
    }, firPayload);

    assert.strictEqual(linkRes.status, 201, "FIR registration must return 201 Created");
    assert.strictEqual(linkRes.body.success, true);
    assert.ok(linkRes.body.data.fir_id);
    assert.ok(linkRes.body.data.fir_number);

    testFIRId = linkRes.body.data.fir_id;
    testFIRNumber = linkRes.body.data.fir_number;
    assert.match(testFIRNumber, /^FIR-/, "FIR number must follow backend sequence prefix FIR-");

    // Negative check: Non-authorized officer (Duty Officer) cannot register FIR
    const unauthRes = await request(`http://localhost:5050/api/v1/firs`, {
      method: "POST",
      headers: { Cookie: dutyCookie },
    }, {
      fir_number: "UNAUTH-FIR-001",
      crime_category: "ROBBERY",
      filed_date: "2026-09-12",
      section_ids: [1],
    });
    assert.strictEqual(unauthRes.status, 403, "Duty Officer must be 403 forbidden from creating direct FIR");
  });

  // Workflow E: FIR to Investigation Case
  test("Workflow E: Open Case from Registered FIR and Assign Officers", async () => {
    const casePayload = {
      case_title: "Investigation into Commercial Shop Extortion",
      opened_date: "2026-09-13",
      fir_id: testFIRId,
      lead_officer_id: 2, // det_shakil
    };

    const caseRes = await request("http://localhost:5050/api/v1/cases", {
      method: "POST",
      headers: { Cookie: oicCookie },
    }, casePayload);

    assert.strictEqual(caseRes.status, 201, "Opening case must return 201 Created");
    assert.strictEqual(caseRes.body.success, true);
    assert.ok(caseRes.body.data.case_id);

    testCaseId = caseRes.body.data.case_id;

    // Retrieve Case Dossier to verify persistence
    const dossierRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}`, {
      headers: { Cookie: investigatorCookie },
    });
    assert.strictEqual(dossierRes.status, 200);
    assert.strictEqual(dossierRes.body.data.case.case_id, testCaseId);
  });

  // Workflow F: Participants Linking
  test("Workflow F: Create and Link Participants to Case", async () => {
    // 1. Create Suspect
    const suspectRes = await request("http://localhost:5050/api/v1/suspects", {
      method: "POST",
      headers: { Cookie: investigatorCookie },
    }, {
      first_name: "Kamal",
      last_name: "Hossain",
      suspicion_level: "High",
      status: "UNDER_INVESTIGATION",
    });
    assert.strictEqual(suspectRes.status, 201);
    const suspectId = suspectRes.body.data.suspect_id;

    // Link suspect to case
    const linkSRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}/suspects`, {
      method: "POST",
      headers: { Cookie: investigatorCookie },
    }, {
      participant_id: suspectId,
      role_or_impact: "Alleged extortion letter delivery agent",
    });
    assert.strictEqual(linkSRes.status, 200);

    // 2. Create Witness
    const witnessRes = await request("http://localhost:5050/api/v1/witnesses", {
      method: "POST",
      headers: { Cookie: investigatorCookie },
    }, {
      name: "Abdul Karim (Security Guard)",
      phone: "01788776655",
      reliability: "High",
      is_protected: true,
      statement_summary: "Observed two individuals placing envelope under shutter at 21:00.",
    });
    assert.strictEqual(witnessRes.status, 201);
    const witnessId = witnessRes.body.data.witness_id;

    // Link witness to case
    const linkWRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}/witnesses`, {
      method: "POST",
      headers: { Cookie: investigatorCookie },
    }, {
      participant_id: witnessId,
      role_or_impact: "Eyewitness to letter drop",
    });
    assert.strictEqual(linkWRes.status, 200);
  });

  // Workflow G: Investigation Case Activity & Timeline
  test("Workflow G: Case Lifecycle Transition, Remarks and Timeline Audit", async () => {
    // 1. Transition case to Under Investigation with remarks
    const statusPayload = {
      status: "Under Investigation",
      remarks: "Field team dispatched to Mirpur Road site for preliminary inspection.",
    };
    const updateRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}/status`, {
      method: "PUT",
      headers: { Cookie: oicCookie },
    }, statusPayload);
    assert.strictEqual(updateRes.status, 200);

    // 2. Fetch case status history timeline
    const histRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}/history`, {
      headers: { Cookie: investigatorCookie },
    });
    assert.strictEqual(histRes.status, 200);
    assert.ok(Array.isArray(histRes.body.data));
    assert.ok(histRes.body.data.length >= 2, "History must contain initial creation and transition logs");

    // 3. Verify latest history item
    const latest = histRes.body.data[histRes.body.data.length - 1];
    assert.strictEqual(latest.status, "Under Investigation");
    assert.strictEqual(latest.remarks, "Field team dispatched to Mirpur Road site for preliminary inspection.");
    assert.strictEqual(latest.changed_by, "insp_tariq");

    // 4. Invalid status transition rejected
    const badRes = await request(`http://localhost:5050/api/v1/cases/${testCaseId}/status`, {
      method: "PUT",
      headers: { Cookie: oicCookie },
    }, { status: "NonExistentStatus", remarks: "invalid" });
    assert.strictEqual(badRes.status, 400);
  });

  // Workflow H: Evidence Registration and Chain of Custody
  test("Workflow H: Register Evidence and Transition Custody", async () => {
    const evidencePayload = {
      case_id: testCaseId,
      title: "Extortion Demand Letter & Handwritten Note",
      description: "Recovered handwritten letter demanding money with stamp seal.",
      evidence_type: "Documentary",
      storage_location: "Secure Evidence Locker A-12",
      collected_by_officer_id: 2,
    };

    const createEvRes = await request("http://localhost:5050/api/v1/evidence", {
      method: "POST",
      headers: { Cookie: evidenceCookie },
    }, evidencePayload);

    assert.strictEqual(createEvRes.status, 201, "Evidence creation must return 201 Created");
    assert.strictEqual(createEvRes.body.success, true);
    testEvidenceId = createEvRes.body.data.evidence_id;

    // Update Evidence Status (Forensic Analysis)
    const updateRes = await request(`http://localhost:5050/api/v1/evidence/${testEvidenceId}/status`, {
      method: "PUT",
      headers: { Cookie: evidenceCookie },
    }, {
      status: "In Lab Analysis",
      storage_location: "CID Forensic Document Lab Room 3",
      remarks: "Transferred for handwriting comparison and latent print dusting.",
    });
    assert.strictEqual(updateRes.status, 200);

    // Verify Chain of Custody Log
    const chainRes = await request(`http://localhost:5050/api/v1/evidence/${testEvidenceId}/chain`, {
      headers: { Cookie: evidenceCookie },
    });
    assert.strictEqual(chainRes.status, 200);
    assert.ok(chainRes.body.data.length >= 2, "Chain of custody must contain initial intake and transfer events");
  });

  // Workflow I: Search Functionality
  test("Workflow I: Global Multi-Entity Search Verification", async () => {
    // Search for the tracking code
    const s1 = await request(`http://localhost:5050/api/v1/complaints?search=${testTrackingCode}`, {
      headers: { Cookie: dutyCookie },
    });
    assert.strictEqual(s1.status, 200);
    assert.strictEqual(s1.body.data[0].tracking_code, testTrackingCode);

    // Search for the Case Number
    const s2 = await request(`http://localhost:5050/api/v1/cases?search=Extortion`, {
      headers: { Cookie: investigatorCookie },
    });
    assert.strictEqual(s2.status, 200);
    assert.ok(s2.body.data.length > 0);
  });

  // Workflow J: Reports
  test("Workflow J: Analytics & Reporting Data Integrity", async () => {
    const overviewRes = await request("http://localhost:5050/api/v1/analytics/overview", {
      headers: { Cookie: investigatorCookie },
    });
    assert.strictEqual(overviewRes.status, 200);
    assert.ok(overviewRes.body.data);

    const caseloadRes = await request("http://localhost:5050/api/v1/officers/caseload", {
      headers: { Cookie: oicCookie },
    });
    assert.strictEqual(caseloadRes.status, 200);
    assert.ok(Array.isArray(caseloadRes.body.data));
  });
});
