"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { WaterRippleGate } from "@/components/entry/WaterRippleGate";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { TopBarHUD } from "@/components/layout/TopBarHUD";
import dynamic from "next/dynamic";
import { CaseClearanceGauge } from "@/components/tactical/CaseClearanceGauge";
import { EvidenceVaultGauge } from "@/components/tactical/EvidenceVaultGauge";
import { CrimeIncidentChart } from "@/components/tactical/CrimeIncidentChart";
import { OfficerDossierCard } from "@/components/tactical/OfficerDossierCard";
import { EvidenceVaultLocker } from "@/components/tactical/EvidenceVaultLocker";

const RealCrimeGISMap = dynamic(
  () => import("@/components/tactical/RealCrimeGISMap").then((m) => m.RealCrimeGISMap),
  {
    ssr: false,
    loading: () => (
      <div className="tactical-card p-6 h-[520px] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span className="font-mono-code text-xs text-neutral-400 mt-3">INITIALIZING GEOSPATIAL MAP FEED...</span>
      </div>
    ),
  }
);
import { CaseDossierModal } from "@/components/modals/CaseDossierModal";
import { NewCaseModal } from "@/components/modals/NewCaseModal";
import { IntakeModal } from "@/components/modals/IntakeModal";
import { EvidenceCustodyModal } from "@/components/modals/EvidenceCustodyModal";
import { AuthModal } from "@/components/modals/AuthModal";
import { api } from "@/lib/api";
import {
  CaseOverview,
  CaseDossier,
  DashboardOverview,
  CasePipeline,
  Officer,
  FIR,
  GD,
  Complainant,
  LegalSection,
  Suspect,
  Victim,
  Witness,
  LocationItem,
  Evidence,
  UserProfile,
  OfficerCaseload,
  AgencyBranch,
} from "@/lib/types";
import {
  FolderLock,
  Search,
  Filter,
  Shield,
  FilePlus,
  Users,
  Package,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Plus,
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  // Gate display state
  const [showGate, setShowGate] = useState(true);

  // Active Tab
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");

  // User session
  const [user, setUser] = useState<UserProfile | null>(null);

  // Analytics & Data states
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [pipeline, setPipeline] = useState<CasePipeline[]>([]);
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [officerCaseload, setOfficerCaseload] = useState<OfficerCaseload[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [firs, setFirs] = useState<FIR[]>([]);
  const [gds, setGds] = useState<GD[]>([]);
  const [complainants, setComplainants] = useState<Complainant[]>([]);
  const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);

  // Modals
  const [selectedCaseDossier, setSelectedCaseDossier] = useState<CaseDossier | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedEvidenceForCustody, setSelectedEvidenceForCustody] = useState<Evidence | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [caseStatusFilter, setCaseStatusFilter] = useState("All");

  // Audio state
  const [soundPlaying, setSoundPlaying] = useState(false);

  // Initialize and load core backend data
  const loadData = async () => {
    try {
      // 1. Verify authenticated session via HttpOnly cookie
      const meRes = await api.getMe();
      if (!meRes.success || !meRes.data) {
        router.push("/login");
        return;
      }
      setUser(meRes.data);

      // 2. Fetch Overview & Pipeline
      const [ovRes, pipeRes, caseRes, offRes, fRes, gdRes, cRes, secRes, suspRes, vicRes, witRes, locRes, evidRes, branchRes, caseLoadRes] =
        await Promise.all([
          api.getDashboardOverview(),
          api.getCasePipeline(),
          api.searchCases(),
          api.listOfficers(),
          api.listFIRs(),
          api.listGDs(),
          api.listComplainants(),
          api.listLegalSections(),
          api.listSuspects(),
          api.listVictims(),
          api.listWitnesses(),
          api.listLocations(),
          api.listEvidence(),
          api.listBranches(),
          api.getOfficerCaseload(),
        ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (pipeRes.success && pipeRes.data) setPipeline(pipeRes.data);
      if (caseRes.success && caseRes.data) setCases(caseRes.data);
      if (offRes.success && offRes.data) setOfficers(offRes.data);
      if (fRes.success && fRes.data) setFirs(fRes.data);
      if (gdRes.success && gdRes.data) setGds(gdRes.data);
      if (cRes.success && cRes.data) setComplainants(cRes.data);
      if (secRes.success && secRes.data) setLegalSections(secRes.data);
      if (suspRes.success && suspRes.data) setSuspects(suspRes.data);
      if (vicRes.success && vicRes.data) setVictims(vicRes.data);
      if (witRes.success && witRes.data) setWitnesses(witRes.data);
      if (locRes.success && locRes.data) setLocations(locRes.data);
      if (evidRes.success && evidRes.data) setEvidenceList(evidRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
      if (caseLoadRes.success && caseLoadRes.data) setOfficerCaseload(caseLoadRes.data);
    } catch (err) {
      console.warn("Initial load warning:", err);
    }
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (active) {
        await loadData();
      }
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.case_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.fir_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.lead_officer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = caseStatusFilter === "All" || c.case_status === caseStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [cases, searchQuery, caseStatusFilter]);

  // Open Case Dossier
  const handleOpenDossier = async (caseId: number) => {
    const res = await api.getCaseDossier(caseId);
    if (res.success && res.data) {
      setSelectedCaseDossier(res.data);
    }
  };

  // Update Case Status
  const handleUpdateCaseStatus = async (newStatus: string, remarks: string) => {
    if (!selectedCaseDossier) return;
    const res = await api.updateCaseStatus(selectedCaseDossier.case.case_id, {
      status: newStatus,
      remarks,
    });
    if (res.success) {
      // Reload dossier & case list
      handleOpenDossier(selectedCaseDossier.case.case_id);
      loadData();
    }
  };

  // Open New Case submit
  const handleCreateCase = async (data: Parameters<typeof api.openCase>[0]) => {
    const res = await api.openCase(data);
    if (res.success) {
      loadData();
    }
  };

  // Intake Submissions
  const handleCreateComplainant = async (name: string, phone: string, email: string) => {
    await api.createComplainant({
      name,
      contacts: [
        { contact_type: "phone", contact_value: phone, is_primary: true },
        ...(email ? [{ contact_type: "email", contact_value: email, is_primary: false }] : []),
      ],
    });
    loadData();
  };

  const handleCreateGD = async (gd_number: string, gd_date: string, subject: string, complainant_id: number) => {
    await api.createGD({ gd_number, gd_date, subject, complainant_id });
    loadData();
  };

  const handleCreateFIR = async (fir_number: string, crime_category: string, filed_date: string, gd_id?: number, section_ids?: number[]) => {
    await api.createFIR({
      fir_number,
      crime_category,
      filed_date,
      gd_id,
      section_ids: section_ids || [],
    });
    loadData();
  };

  // Evidence Custody Transfer
  const handleEvidenceCustodySubmit = async (id: number, status: string, location: string, remarks: string) => {
    await api.updateEvidenceStatus(id, { status, storage_location: location, remarks });
    loadData();
  };

  // Login handler
  const handleLogin = async (username: string, pass: string) => {
    const res = await api.login(username, pass);
    if (res.success && res.data) {
      setUser(res.data.user);
      loadData();
      return true;
    }
    return false;
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="flex h-screen w-screen bg-[#090b0f] text-neutral-100 overflow-hidden font-sans">
      {/* 1. CINEMATIC WATER RIPPLE ENTRY GATE */}
      {showGate && <WaterRippleGate onOpen={() => setShowGate(false)} />}

      {/* 2. TACTICAL SIDEBAR */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenGate={() => setShowGate(true)}
        onLogout={handleLogout}
        userRole={user?.roles?.[0]}
      />

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Telemetric HUD */}
        <TopBarHUD
          user={user}
          overview={overview}
          onOpenNewCase={() => setShowNewCaseModal(true)}
          onOpenIntake={() => setShowIntakeModal(true)}
          onOpenAuthModal={() => setShowAuthModal(true)}
          soundPlaying={soundPlaying}
          onToggleSound={() => setSoundPlaying(!soundPlaying)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OPERATIONS DASHBOARD (Faithfully incorporating both Screenshots!) */}
          {currentTab === "dashboard" && (
            <div className="space-y-6">
              {/* Row 1: Tactical Metrics & Gauges (Police Investigation & Forensics) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Incident Intake & Investigation Resolution Trend Chart (Col 5) */}
                <div className="lg:col-span-5 h-72">
                  <CrimeIncidentChart />
                </div>

                {/* Case Clearance & Vault Storage Gauges (Col 4) */}
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CaseClearanceGauge
                    rate={86}
                    label="Clearance Rate"
                    sublabel="Conviction Ratio"
                    statusText="DEFCON-1 Active"
                  />
                  <EvidenceVaultGauge
                    fillPercentage={78}
                    title="Evidence Vault"
                    itemCount={overview?.evidence_count || 28}
                    securityLevel="DEFCON-2 Biometric"
                  />
                </div>

                {/* Investigating Officer Dossier Card (Col 3) */}
                <div className="lg:col-span-3 h-72">
                  <OfficerDossierCard
                    officer={{
                      name: user?.officer_name || "Chief Insp. Arafat Faisal",
                      badge_no: user?.badge_no || "ORC-1001",
                      rank: user?.rank || "Chief Inspector",
                      branch_name: user?.branch_name || "Central HQ, Dhaka",
                      active_cases: 5,
                      closed_cases: 12,
                      rating: 4.9,
                      status: "On Active Duty",
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Real GIS Crime Scene Map & Forensic Vault Lockers */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Real GIS Dark Leaflet Crime Scene Map (Col 7) */}
                <div className="lg:col-span-7">
                  <RealCrimeGISMap />
                </div>

                {/* Forensic Evidence Vault & Chain of Custody Lockers (Col 5) */}
                <div className="lg:col-span-5">
                  <EvidenceVaultLocker />
                </div>
              </div>

              {/* Row 3: Investigation Intake Pipeline Tracker (GD -> FIR -> Case) */}
              <div className="tactical-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-tactical text-sm font-bold text-white tracking-wide">
                      INCIDENT PROGRESSION PIPELINE (GD &bull; FIR &bull; STATUTORY SECTIONS &bull; ACTIVE CASE)
                    </h3>
                    <p className="font-mono-code text-xs text-neutral-400">
                      Live progression view v_fir_case_pipeline
                    </p>
                  </div>
                  <button
                    onClick={() => setShowIntakeModal(true)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                  >
                    + Log New Incident
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-neutral-500 border-b border-neutral-800 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">FIR No</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Source GD</th>
                        <th className="py-2 px-3">Complainant</th>
                        <th className="py-2 px-3">Penal Sections</th>
                        <th className="py-2 px-3">Formal Case</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {pipeline.slice(0, 5).map((p) => (
                        <tr key={p.fir_id} className="hover:bg-neutral-800/30 transition">
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">{p.fir_number}</td>
                          <td className="py-2.5 px-3">{p.crime_category}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{p.gd_number || "Direct"}</td>
                          <td className="py-2.5 px-3 text-white">{p.complainant_name}</td>
                          <td className="py-2.5 px-3 text-amber-300">{p.applicable_legal_sections || "Sec 302"}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">{p.case_title || "Pending Assignment"}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                              {p.case_status || "Pre-Investigation"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATION CASES CENTRAL */}
          {currentTab === "cases" && (
            <div className="space-y-5">
              {/* Header & Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-tactical text-xl font-bold text-white tracking-wide">
                    INVESTIGATION CASES REPOSITORY
                  </h2>
                  <p className="font-mono-code text-xs text-neutral-400">
                    Comprehensive Dossiers &bull; Chain of Custody &bull; Multi-Entity Links
                  </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto">
                  {["All", "Open", "Under Investigation", "Pending Review", "Closed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setCaseStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-mono transition ${
                        caseStatusFilter === s
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="px-4 py-1.5 rounded-full bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition ml-2"
                  >
                    + OPEN CASE
                  </button>
                </div>
              </div>

              {/* Case Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCases.map((c) => (
                  <div
                    key={c.case_id}
                    onClick={() => handleOpenDossier(c.case_id)}
                    className="tactical-card p-5 cursor-pointer hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                        <span className="font-mono-code text-xs font-bold text-cyan-400">
                          CASE #{c.case_id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          {c.case_status}
                        </span>
                      </div>

                      <h3 className="font-tactical font-semibold text-base text-white mt-3 group-hover:text-cyan-300 transition">
                        {c.case_title}
                      </h3>

                      <p className="font-mono-code text-xs text-neutral-400 mt-1">
                        Category: <span className="text-neutral-200">{c.crime_category || "Felony"}</span>
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-neutral-400">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{c.branch_name} ({c.district})</span>
                      </div>
                    </div>

                    {/* Footer Counts */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 grid grid-cols-4 gap-1 text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">SUSPECTS</span>
                        <span className="font-bold text-red-400">{c.suspect_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">VICTIMS</span>
                        <span className="font-bold text-amber-400">{c.victim_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">WITNESS</span>
                        <span className="font-bold text-cyan-400">{c.witness_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">EVIDENCE</span>
                        <span className="font-bold text-emerald-400">{c.evidence_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INTAKE (GD & FIR) */}
          {currentTab === "intake" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-tactical text-xl font-bold text-white tracking-wide">
                    INVESTIGATION INTAKE DIRECTORY
                  </h2>
                  <p className="font-mono-code text-xs text-neutral-400">
                    Complainants &bull; General Diary (GD) &bull; First Information Reports (FIR)
                  </p>
                </div>
                <button
                  onClick={() => setShowIntakeModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
                >
                  + INTAKE RECORD
                </button>
              </div>

              {/* GD Table */}
              <div className="tactical-card p-5">
                <h3 className="font-tactical text-sm font-bold text-white mb-3">General Diary (GD) Register</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-neutral-500 border-b border-neutral-800 uppercase">
                      <tr>
                        <th className="py-2 px-3">GD Number</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Complainant</th>
                        <th className="py-2 px-3">Subject</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {gds.map((g) => (
                        <tr key={g.gd_id} className="hover:bg-neutral-800/30">
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">{g.gd_number}</td>
                          <td className="py-2.5 px-3">{g.gd_date}</td>
                          <td className="py-2.5 px-3 text-white">{g.complainant_name || "Citizen"}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{g.subject}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FIR Table */}
              <div className="tactical-card p-5">
                <h3 className="font-tactical text-sm font-bold text-white mb-3">First Information Reports (FIR)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-neutral-500 border-b border-neutral-800 uppercase">
                      <tr>
                        <th className="py-2 px-3">FIR Number</th>
                        <th className="py-2 px-3">Crime Category</th>
                        <th className="py-2 px-3">Filed Date</th>
                        <th className="py-2 px-3">Source GD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {firs.map((f) => (
                        <tr key={f.fir_id} className="hover:bg-neutral-800/30">
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">{f.fir_number}</td>
                          <td className="py-2.5 px-3 text-white">{f.crime_category}</td>
                          <td className="py-2.5 px-3">{f.filed_date}</td>
                          <td className="py-2.5 px-3 text-neutral-400">{f.gd_number || "Direct"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARTICIPANTS & SUSPECTS */}
          {currentTab === "participants" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-tactical text-xl font-bold text-white tracking-wide">
                  CRIMINAL PARTICIPANTS &amp; PERSONS OF INTEREST
                </h2>
                <p className="font-mono-code text-xs text-neutral-400">
                  Suspect Profiles &bull; Victims &bull; Protected Witnesses &bull; Locations
                </p>
              </div>

              {/* Suspects Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suspects.map((s) => (
                  <div key={s.suspect_id} className="tactical-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono-code text-xs text-neutral-500">
                          SUSPECT #{s.suspect_id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            s.suspicion_level === "High"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : s.suspicion_level === "Medium"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                          }`}
                        >
                          {s.suspicion_level} Suspicion
                        </span>
                      </div>

                      <h3 className="font-tactical text-base font-bold text-white mt-2">
                        {s.first_name} {s.last_name}
                      </h3>

                      <p className="font-mono-code text-xs text-neutral-400 mt-1">
                        Age: {s.age || "N/A"} &bull; Status: {s.status}
                      </p>

                      {s.identification_sign && (
                        <p className="font-mono-code text-xs text-neutral-400 mt-2 bg-neutral-900/80 p-2 rounded-lg border border-neutral-800">
                          Mark: {s.identification_sign}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Witnesses & Victims Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Witnesses */}
                <div className="tactical-card p-5">
                  <h3 className="font-tactical text-sm font-bold text-white mb-3">Witness Registry</h3>
                  <div className="space-y-2.5">
                    {witnesses.map((w) => (
                      <div key={w.witness_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-tactical text-sm font-semibold text-white">{w.name}</h4>
                          <p className="font-mono-code text-xs text-neutral-400">{w.statement_summary || "Statement on file"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {w.is_protected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300">
                              🛡️ Protected
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300">
                            {w.reliability}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Victims */}
                <div className="tactical-card p-5">
                  <h3 className="font-tactical text-sm font-bold text-white mb-3">Victims Directory</h3>
                  <div className="space-y-2.5">
                    {victims.map((v) => (
                      <div key={v.victim_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-tactical text-sm font-semibold text-white">{v.name}</h4>
                          <p className="font-mono-code text-xs text-neutral-400">{v.condition_notes || "Assisted"}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${v.is_deceased ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                          {v.is_deceased ? "Deceased" : "Surviving"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EVIDENCE & CHAIN OF CUSTODY */}
          {currentTab === "evidence" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-tactical text-xl font-bold text-white tracking-wide">
                  EVIDENCE LOCKER &amp; CHAIN OF CUSTODY
                </h2>
                <p className="font-mono-code text-xs text-neutral-400">
                  Forensic Chain Logs &bull; Physical Vault Storage &bull; Ballistics &bull; Digital Hardware
                </p>
              </div>

              {/* Evidence Table */}
              <div className="tactical-card p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-neutral-500 border-b border-neutral-800 uppercase">
                      <tr>
                        <th className="py-2 px-3">Item #</th>
                        <th className="py-2 px-3">Case ID</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Storage Location</th>
                        <th className="py-2 px-3">Custody Status</th>
                        <th className="py-2 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {evidenceList.map((e) => (
                        <tr key={e.evidence_id} className="hover:bg-neutral-800/30">
                          <td className="py-3 px-3 text-cyan-400 font-bold">#{e.evidence_no}</td>
                          <td className="py-3 px-3">CASE-{e.case_id}</td>
                          <td className="py-3 px-3 font-semibold text-white">{e.title}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300">
                              {e.evidence_type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-neutral-400">{e.storage_location || "Vault A"}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              {e.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedEvidenceForCustody(e)}
                              className="px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition"
                            >
                              Transition Custody
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AGENCY BRANCHES & PERSONNEL */}
          {currentTab === "agency" && (
            <div className="space-y-6">
              <div>
                <h2 className="font-tactical text-xl font-bold text-white tracking-wide">
                  AGENCY ORGANIZATION &amp; PERSONNEL
                </h2>
                <p className="font-mono-code text-xs text-neutral-400">
                  Regional Branches &bull; Officer Workload Caseloads &bull; Access Control
                </p>
              </div>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {branches.map((b) => (
                  <div key={b.branch_id} className="tactical-card p-5">
                    <div className="flex items-center gap-2 text-cyan-400 mb-1">
                      <Building2 className="w-4 h-4" />
                      <span className="font-mono-code text-xs font-bold">BRANCH #{b.branch_id}</span>
                    </div>
                    <h3 className="font-tactical text-base font-bold text-white">{b.branch_name}</h3>
                    <p className="font-mono-code text-xs text-neutral-400 mt-1">District: {b.district}</p>
                  </div>
                ))}
              </div>

              {/* Officer Caseload Table */}
              <div className="tactical-card p-5">
                <h3 className="font-tactical text-sm font-bold text-white mb-3">Officer Workload Allocation</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-neutral-500 border-b border-neutral-800 uppercase">
                      <tr>
                        <th className="py-2 px-3">Badge No</th>
                        <th className="py-2 px-3">Officer Name</th>
                        <th className="py-2 px-3">Rank</th>
                        <th className="py-2 px-3">Branch</th>
                        <th className="py-2 px-3 text-center">Total Assigned</th>
                        <th className="py-2 px-3 text-center">Active Cases</th>
                        <th className="py-2 px-3 text-center">Solved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {officerCaseload.map((oc) => (
                        <tr key={oc.officer_id} className="hover:bg-neutral-800/30">
                          <td className="py-3 px-3 text-amber-400 font-bold">{oc.badge_no}</td>
                          <td className="py-3 px-3 text-white font-semibold">{oc.officer_name}</td>
                          <td className="py-3 px-3 text-neutral-400">{oc.rank}</td>
                          <td className="py-3 px-3">{oc.branch_name} ({oc.district})</td>
                          <td className="py-3 px-3 text-center font-bold text-white">{oc.total_cases_assigned}</td>
                          <td className="py-3 px-3 text-center font-bold text-cyan-400">{oc.active_cases}</td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-400">{oc.closed_cases}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALS */}
      {selectedCaseDossier && (
        <CaseDossierModal
          dossier={selectedCaseDossier}
          onClose={() => setSelectedCaseDossier(null)}
          onUpdateStatus={handleUpdateCaseStatus}
        />
      )}

      {showNewCaseModal && (
        <NewCaseModal
          firs={firs}
          officers={officers}
          onClose={() => setShowNewCaseModal(false)}
          onSubmit={handleCreateCase}
        />
      )}

      {showIntakeModal && (
        <IntakeModal
          complainants={complainants}
          gds={gds}
          legalSections={legalSections}
          onClose={() => setShowIntakeModal(false)}
          onCreateComplainant={handleCreateComplainant}
          onCreateGD={handleCreateGD}
          onCreateFIR={handleCreateFIR}
        />
      )}

      {selectedEvidenceForCustody && (
        <EvidenceCustodyModal
          evidence={selectedEvidenceForCustody}
          onClose={() => setSelectedEvidenceForCustody(null)}
          onSubmit={handleEvidenceCustodySubmit}
        />
      )}

      {showAuthModal && (
        <AuthModal
          currentUser={user}
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}
    </div>
  );
}
