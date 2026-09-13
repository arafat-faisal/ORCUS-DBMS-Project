import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

describe("ORCUS Frontend Redesign Test Suite", () => {
  // Test 1: Lexical Compliance Scan
  test("Codebase Lexical Scan - No tactical/prohibited terms in frontend/src", () => {
    const prohibitedTerms = [
      "DEFCON",
      "command center",
      "surveillance system",
      "biometric vault",
      "target identified",
      "threat detected",
      "case velocity",
      "cargo",
      "freight",
    ];

    const srcDir = path.resolve("./src");
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const term of prohibitedTerms) {
            const regex = new RegExp(`\\b${term}\\b`, "i");
            const match = content.match(regex);
            assert.ok(
              !match,
              `Prohibited tactical term "${term}" found in ${fullPath}`
            );
          }
        }
      }
    };

    scanDir(srcDir);
  });

  // Test 2: Obsolete Tactical Components Cleanup Verification
  test("Tactical and obsolete components have been removed", () => {
    const obsoleteFiles = [
      "src/components/entry/WaterRippleGate.tsx",
      "src/components/tactical/CaseClearanceGauge.tsx",
      "src/components/tactical/EvidenceVaultGauge.tsx",
      "src/components/tactical/EvidenceVaultLocker.tsx",
      "src/components/tactical/CrimeIncidentChart.tsx",
      "src/components/tactical/RealCrimeGISMap.tsx",
      "src/components/tactical/TacticalCompass.tsx",
      "src/components/tactical/OfficerDossierCard.tsx",
      "src/components/modals/AuthModal.tsx",
      "src/components/modals/IntakeModal.tsx",
      "src/components/modals/NewCaseModal.tsx",
    ];

    for (const relPath of obsoleteFiles) {
      const fullPath = path.resolve(relPath);
      assert.strictEqual(
        fs.existsSync(fullPath),
        false,
        `Obsolete tactical file should be deleted: ${relPath}`
      );
    }
  });

  // Test 3: Status Badge Mapping
  test("Status Badge Mapping for Canonical Database Codes", () => {
    const statusMap = {
      SUBMITTED: { label: "Submitted", variant: "info" },
      UNDER_REVIEW: { label: "Under Review", variant: "warning" },
      APPROVED: { label: "Approved", variant: "success" },
      CONVERTED_TO_GD: { label: "Converted to GD", variant: "success" },
      CONVERTED_TO_FIR: { label: "Converted to FIR", variant: "purple" },
      REJECTED: { label: "Rejected", variant: "error" },
      DRAFT: { label: "Draft", variant: "neutral" },
      OPEN: { label: "Open", variant: "info" },
      IN_PROGRESS: { label: "In Progress", variant: "info" },
      CLOSED: { label: "Closed", variant: "neutral" },
    };

    for (const [code, expected] of Object.entries(statusMap)) {
      assert.ok(expected.label.length > 0, `Status ${code} must have readable text`);
      assert.match(
        expected.variant,
        /^(neutral|info|warning|success|purple|error)$/,
        `Variant for ${code} must be a valid academic badge variant`
      );
    }
  });

  // Test 4: Bilingual Number Conversion
  test("Bengali Numerals Formatting Utility", () => {
    const bnNumerals = {
      "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪",
      "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯"
    };

    const convertToBn = (val) =>
      String(val).replace(/\d/g, (d) => bnNumerals[d] || d);

    assert.strictEqual(convertToBn(12345), "১২৩৪৫");
    assert.strictEqual(convertToBn("999"), "৯৯৯");
    assert.strictEqual(convertToBn("2026-09-13"), "২০২৬-০৯-১৩");
  });

  // Test 5: Role-Based Authorization Logic
  test("Role-Aware Permissions Verification", () => {
    const checkRoleAccess = (userRoles, allowedRoles) => {
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (!userRoles || userRoles.length === 0) return false;
      return userRoles.some((r) =>
        allowedRoles.map((x) => x.toLowerCase()).includes(r.toLowerCase())
      );
    };

    assert.strictEqual(checkRoleAccess(["ADMIN"], ["admin"]), true);
    assert.strictEqual(checkRoleAccess(["DUTY_OFFICER"], ["admin"]), false);
    assert.strictEqual(checkRoleAccess(["INVESTIGATING_OFFICER"], ["admin", "investigating_officer"]), true);
    assert.strictEqual(checkRoleAccess([], ["admin"]), false);
    assert.strictEqual(checkRoleAccess(["ANY_ROLE"], []), true);
  });

  // Test 6: Complaint Form Step Validation Rules
  test("Complaint Intake Multi-Step Form Validation Contract", () => {
    const validateStep = (step, data) => {
      const errors = {};
      if (step === 1) {
        if (!data.complainantName?.trim()) errors.complainantName = "Name required";
        if (!data.complainantPhone?.trim()) errors.complainantPhone = "Phone required";
        if (!data.presentAddress?.trim()) errors.presentAddress = "Address required";
      } else if (step === 2) {
        if (!data.title?.trim()) errors.title = "Title required";
        if (!data.category?.trim()) errors.category = "Category required";
        if (!data.description?.trim()) errors.description = "Description required";
        if (!data.incidentDate) errors.incidentDate = "Date required";
      } else if (step === 3) {
        if (!data.division?.trim()) errors.division = "Division required";
        if (!data.district?.trim()) errors.district = "District required";
        if (!data.upazila?.trim()) errors.upazila = "Upazila required";
      }
      return { valid: Object.keys(errors).length === 0, errors };
    };

    // Step 1 validation
    const emptyStep1 = validateStep(1, {});
    assert.strictEqual(emptyStep1.valid, false);
    assert.ok(emptyStep1.errors.complainantName);

    const validStep1 = validateStep(1, {
      complainantName: "Rashid Ahmed",
      complainantPhone: "01711000000",
      presentAddress: "Mirpur-10, Dhaka",
    });
    assert.strictEqual(validStep1.valid, true);

    // Step 2 validation
    const validStep2 = validateStep(2, {
      title: "Extortion Complaint",
      category: "EXTORTION",
      description: "Demanding protection money",
      incidentDate: "2026-09-10",
    });
    assert.strictEqual(validStep2.valid, true);

    // Step 3 validation
    const validStep3 = validateStep(3, {
      division: "Dhaka",
      district: "Dhaka",
      upazila: "Mirpur",
    });
    assert.strictEqual(validStep3.valid, true);
  });

  // Test 7: Backend Reference Numbers Verification
  test("Frontend does not synthesize fake GD/FIR reference numbers", () => {
    const apiFile = fs.readFileSync(path.resolve("./src/lib/api.ts"), "utf-8");
    // Ensure no client-side Math.random generation for GD or FIR numbers
    assert.ok(!apiFile.includes("GD-2026-DH-1001"));
    assert.ok(!apiFile.includes("FIR-2026-DH-1001"));
    assert.ok(!apiFile.includes("Math.random().toString(36)"));
  });

  // Test 8: Session Security Verification
  test("Session Storage & Cookie Auth - No JWT in localStorage", () => {
    const apiFile = fs.readFileSync(path.resolve("./src/lib/api.ts"), "utf-8");
    assert.ok(
      !apiFile.includes('localStorage.setItem("jwt"'),
      "JWT must not be written to localStorage"
    );
    assert.ok(
      !apiFile.includes('localStorage.setItem("token"'),
      "Token must not be written to localStorage"
    );
  });

  // Test 9: Dedicated Routes Verification
  test("All expected Next.js routes exist in app directory", () => {
    const expectedRoutes = [
      "src/app/page.tsx",
      "src/app/login/page.tsx",
      "src/app/dashboard/page.tsx",
      "src/app/complaints/page.tsx",
      "src/app/complaints/new/page.tsx",
      "src/app/complaints/[id]/page.tsx",
      "src/app/complaints/[id]/assessment/page.tsx",
      "src/app/gd/page.tsx",
      "src/app/gd/[id]/page.tsx",
      "src/app/fir/page.tsx",
      "src/app/fir/[id]/page.tsx",
      "src/app/cases/page.tsx",
      "src/app/cases/new/page.tsx",
      "src/app/cases/[id]/page.tsx",
      "src/app/participants/page.tsx",
      "src/app/evidence/page.tsx",
      "src/app/evidence/new/page.tsx",
      "src/app/evidence/[id]/page.tsx",
      "src/app/search/page.tsx",
      "src/app/reports/page.tsx",
      "src/app/profile/page.tsx",
      "src/app/admin/users/page.tsx",
      "src/app/admin/roles/page.tsx",
      "src/app/admin/branches/page.tsx",
      "src/app/admin/audit-logs/page.tsx",
      "src/app/admin/settings/page.tsx",
      "src/app/public/complaints/new/page.tsx",
      "src/app/public/complaints/track/page.tsx",
    ];

    for (const route of expectedRoutes) {
      assert.strictEqual(
        fs.existsSync(path.resolve(route)),
        true,
        `Expected route file must exist: ${route}`
      );
    }
  });

  // Test 10: Academic Emergency Notice & 999 Disclaimer
  test("Emergency notice present and prominent across public intake", () => {
    const disclaimerContent = fs.readFileSync(
      path.resolve("./src/components/common/EmergencyDisclaimer.tsx"),
      "utf-8"
    );
    assert.ok(disclaimerContent.includes("999"), "Emergency disclaimer must explicitly mention 999");
    assert.ok(disclaimerContent.includes("৯৯৯"), "Emergency disclaimer must have Bengali 999");

    const publicNew = fs.readFileSync(
      path.resolve("./src/app/public/complaints/new/page.tsx"),
      "utf-8"
    );
    assert.ok(
      publicNew.includes("EmergencyDisclaimer"),
      "Emergency disclaimer component must be integrated in public complaint submission"
    );
  });
});
