// ============================================================================
// ORCUS REST API Client with JWT Auth, Error Recovery & Full Entity Coverage
// ============================================================================

import {
  StandardResponse,
  UserProfile,
  AdminUserItem,
  DashboardOverview,
  CaseOverview,
  CaseDossier,
  CasePipeline,
  OfficerCaseload,
  Officer,
  AgencyBranch,
  GD,
  GDStatusHistory,
  FIR,
  FIRStatusHistory,
  LegalSection,
  Complainant,
  Suspect,
  SuspectDossierItem,
  Victim,
  Witness,
  LocationItem,
  Evidence,
  EvidenceChainLog,
  Role,
  CaseStatusHistory,
  CaseSuspectLink,
  CaseVictimLink,
  CaseWitnessLink,
  CaseLocationLink,
  AuditLog,
  ComplaintCategory,
  Complaint,
  ComplaintStatusHistory,
  ComplaintTransferHistory,
  PublicTrackResponse,
  GeoDivision,
  GeoDistrict,
  GeoUpazila,
  GeoThana,
} from "./types";

const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api/v1"
    : process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api/v1";

const USER_KEY = "orcus_user_profile";

class ApiClient {
  private userProfile: UserProfile | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(USER_KEY);
      if (stored) {
        try {
          this.userProfile = JSON.parse(stored);
        } catch {
          this.userProfile = null;
        }
      }
    }
  }

  public setUserProfile(profile: UserProfile) {
    this.userProfile = profile;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    }
  }

  public clearUserProfile() {
    this.userProfile = null;
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem("orcus_jwt_token"); // Clean up any previous legacy storage
      localStorage.removeItem("orcus_user_profile");
    }
  }

  public getUserProfile(): UserProfile | null {
    if (!this.userProfile && typeof window !== "undefined") {
      const stored = sessionStorage.getItem(USER_KEY);
      if (stored) {
        try {
          this.userProfile = JSON.parse(stored);
        } catch {
          this.userProfile = null;
        }
      }
    }
    return this.userProfile;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<StandardResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, {
        ...options,
        credentials: "include", // Enforce transmitting and receiving HttpOnly secure auth cookies
        headers,
      });

      if (res.status === 401) {
        this.clearUserProfile();
      }

      const json: StandardResponse<T> = await res.json();
      return json;
    } catch (err: unknown) {
      console.warn(`API Error [${endpoint}]:`, err);
      const message = err instanceof Error ? err.message : "Failed to communicate with ORCUS API Server";
      return {
        success: false,
        error: message,
      };
    }
  }

  // --- Auth Endpoints ---
  async login(
    username: string,
    password: string
  ): Promise<StandardResponse<{ token?: string; user: UserProfile }>> {
    const res = await this.request<{ token?: string; user: UserProfile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.success && res.data?.user) {
      this.setUserProfile(res.data.user);
      if (res.data.token && typeof document !== "undefined") {
        document.cookie = `orcus_auth_token=${res.data.token}; path=/; max-age=86400; SameSite=Lax`;
      }
    }
    return res;
  }

  async logout(): Promise<StandardResponse<void>> {
    const res = await this.request<void>("/auth/logout", {
      method: "POST",
    });
    this.clearUserProfile();
    if (typeof document !== "undefined") {
      document.cookie = "orcus_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    return res;
  }

  async getMe(): Promise<StandardResponse<UserProfile>> {
    const res = await this.request<UserProfile>("/auth/me");
    if (res.success && res.data) {
      this.setUserProfile(res.data);
    } else {
      this.clearUserProfile();
    }
    return res;
  }

  async registerUser(data: {
    username: string;
    password: string;
    officer_id?: number;
    role_ids: number[];
  }): Promise<StandardResponse<UserProfile>> {
    return this.request<UserProfile>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listUsers(): Promise<StandardResponse<AdminUserItem[]>> {
    return this.request<AdminUserItem[]>("/users");
  }

  async updateUser(
    userId: number,
    data: { officer_id?: number | null; role_ids?: number[]; branch_ids?: number[] }
  ): Promise<StandardResponse<UserProfile>> {
    return this.request<UserProfile>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateUserStatus(userId: number, isActive: boolean): Promise<StandardResponse<void>> {
    return this.request<void>(`/users/${userId}/status`, {
      method: "PUT",
      body: JSON.stringify({ is_active: isActive }),
    });
  }

  async resetUserPassword(userId: number, newPassword: string): Promise<StandardResponse<void>> {
    return this.request<void>(`/users/${userId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    });
  }

  async listRoles(): Promise<StandardResponse<Role[]>> {
    return this.request<Role[]>("/roles");
  }

  async createRole(data: { role_name: string; description?: string }): Promise<StandardResponse<Role>> {
    return this.request<Role>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Analytics & Views ---
  async getDashboardOverview(): Promise<StandardResponse<DashboardOverview>> {
    return this.request<DashboardOverview>("/analytics/overview");
  }

  async getCasePipeline(): Promise<StandardResponse<CasePipeline[]>> {
    return this.request<CasePipeline[]>("/analytics/pipeline");
  }

  async getOfficerCaseload(): Promise<StandardResponse<OfficerCaseload[]>> {
    return this.request<OfficerCaseload[]>("/officers/caseload");
  }

  // --- Organization & Officers ---
  // Public branch directory for the anonymous complaint form (no login required).
  async listPublicBranches(): Promise<StandardResponse<AgencyBranch[]>> {
    return this.request<AgencyBranch[]>(`/public/branches`);
  }

  async listBranches(district?: string): Promise<StandardResponse<AgencyBranch[]>> {
    const q = district ? `?district=${encodeURIComponent(district)}` : "";
    return this.request<AgencyBranch[]>(`/branches${q}`);
  }

  async createBranch(data: { branch_name: string; district: string }): Promise<StandardResponse<AgencyBranch>> {
    return this.request<AgencyBranch>("/branches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listOfficers(search?: string, branch_id?: number): Promise<StandardResponse<Officer[]>> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (branch_id) params.append("branch_id", branch_id.toString());
    const q = params.toString() ? `?${params.toString()}` : "";
    return this.request<Officer[]>(`/officers${q}`);
  }

  async createOfficer(data: {
    badge_no: string;
    first_name: string;
    last_name: string;
    rank: string;
    branch_id: number;
  }): Promise<StandardResponse<Officer>> {
    return this.request<Officer>("/officers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Intake: Complainants, GD, FIR, Legal Sections ---
  async listComplainants(): Promise<StandardResponse<Complainant[]>> {
    return this.request<Complainant[]>("/complainants");
  }

  async getComplainant(id: number): Promise<StandardResponse<Complainant>> {
    return this.request<Complainant>(`/complainants/${id}`);
  }

  async createComplainant(data: {
    name: string;
    contacts: { contact_type: string; contact_value: string; is_primary: boolean }[];
  }): Promise<StandardResponse<Complainant>> {
    return this.request<Complainant>("/complainants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listGDs(complainant_id?: number): Promise<StandardResponse<GD[]>> {
    const q = complainant_id ? `?complainant_id=${complainant_id}` : "";
    return this.request<GD[]>(`/gds${q}`);
  }

  async getGD(id: number): Promise<StandardResponse<GD>> {
    return this.request<GD>(`/gds/${id}`);
  }

  async getGDHistory(id: number): Promise<StandardResponse<GDStatusHistory[]>> {
    return this.request<GDStatusHistory[]>(`/gds/${id}/history`);
  }

  async createGD(data: {
    gd_number?: string;
    gd_date?: string;
    subject: string;
    complainant_id: number;
    incident_place?: string;
    branch_id?: number;
  }): Promise<StandardResponse<GD>> {
    return this.request<GD>("/gds", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateGDStatus(id: number, data: { status: string; decision: string; reason?: string }): Promise<StandardResponse<GD>> {
    return this.request<GD>(`/gds/${id}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async linkGDToFIR(id: number, data: { crime_category: string; filed_date: string; section_ids: number[] }): Promise<StandardResponse<FIR>> {
    return this.request<FIR>(`/gds/${id}/link-fir`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listFIRs(crime_category?: string): Promise<StandardResponse<FIR[]>> {
    const q = crime_category ? `?crime_category=${encodeURIComponent(crime_category)}` : "";
    return this.request<FIR[]>(`/firs${q}`);
  }

  async getFIR(id: number): Promise<StandardResponse<FIR>> {
    return this.request<FIR>(`/firs/${id}`);
  }

  async getFIRHistory(id: number): Promise<StandardResponse<FIRStatusHistory[]>> {
    return this.request<FIRStatusHistory[]>(`/firs/${id}/history`);
  }

  async createFIR(data: {
    fir_number?: string;
    crime_category: string;
    filed_date: string;
    gd_id?: number;
    section_ids: number[];
    place_of_occurrence?: string;
    incident_date?: string;
    incident_time?: string;
  }): Promise<StandardResponse<FIR>> {
    return this.request<FIR>("/firs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateFIRStatus(id: number, data: { status: string; decision: string; reason?: string }): Promise<StandardResponse<FIR>> {
    return this.request<FIR>(`/firs/${id}/status`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async convertComplaintToGD(complaintId: number, data: { subject?: string; gd_date?: string; incident_place?: string }): Promise<StandardResponse<GD>> {
    return this.request<GD>(`/complaints/${complaintId}/convert-gd`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async convertComplaintToFIR(complaintId: number, data: { crime_category: string; filed_date?: string; section_ids: number[]; place_of_occurrence?: string }): Promise<StandardResponse<FIR>> {
    return this.request<FIR>(`/complaints/${complaintId}/convert-fir`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listLegalSections(): Promise<StandardResponse<LegalSection[]>> {
    return this.request<LegalSection[]>("/legal-sections");
  }

  // --- Case Management ---
  async searchCases(filters: {
    search?: string;
    status?: string;
    crime_category?: string;
    lead_officer_id?: number;
    district?: string;
    date_from?: string;
    date_to?: string;
  } = {}): Promise<StandardResponse<CaseOverview[]>> {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.status) params.append("status", filters.status);
    if (filters.crime_category) params.append("crime_category", filters.crime_category);
    if (filters.lead_officer_id) params.append("lead_officer_id", filters.lead_officer_id.toString());
    if (filters.district) params.append("district", filters.district);
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);

    const q = params.toString() ? `?${params.toString()}` : "";
    return this.request<CaseOverview[]>(`/cases${q}`);
  }

  async getCaseDossier(id: number): Promise<StandardResponse<CaseDossier>> {
    return this.request<CaseDossier>(`/cases/${id}`);
  }

  async openCase(data: {
    case_title: string;
    opened_date: string;
    assigned_date?: string;
    fir_id?: number;
    lead_officer_id?: number;
  }): Promise<StandardResponse<CaseOverview>> {
    return this.request<CaseOverview>("/cases", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCaseStatus(
    id: number,
    data: { status: string; remarks: string }
  ): Promise<StandardResponse<CaseOverview>> {
    return this.request<CaseOverview>(`/cases/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getCaseHistory(id: number): Promise<StandardResponse<CaseStatusHistory[]>> {
    return this.request<CaseStatusHistory[]>(`/cases/${id}/history`);
  }

  // --- Participants & Location ---
  async listSuspects(search?: string, suspicion_level?: string, status?: string): Promise<StandardResponse<Suspect[]>> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (suspicion_level) params.append("suspicion_level", suspicion_level);
    if (status) params.append("status", status);
    const q = params.toString() ? `?${params.toString()}` : "";
    return this.request<Suspect[]>(`/suspects${q}`);
  }

  async getSuspect(id: number): Promise<StandardResponse<Suspect>> {
    return this.request<Suspect>(`/suspects/${id}`);
  }

  async getSuspectDossier(id: number): Promise<StandardResponse<SuspectDossierItem[]>> {
    return this.request<SuspectDossierItem[]>(`/suspects/${id}/dossier`);
  }

  async createSuspect(data: {
    first_name: string;
    last_name: string;
    age?: number;
    date_of_birth?: string;
    identification_sign?: string;
    suspicion_level: string;
    status?: string;
  }): Promise<StandardResponse<Suspect>> {
    return this.request<Suspect>("/suspects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listVictims(): Promise<StandardResponse<Victim[]>> {
    return this.request<Victim[]>("/victims");
  }

  async createVictim(data: {
    name: string;
    phone?: string;
    age?: number;
    identification_sign?: string;
    condition_notes?: string;
    is_deceased?: boolean;
  }): Promise<StandardResponse<Victim>> {
    return this.request<Victim>("/victims", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listWitnesses(protectedOnly?: boolean): Promise<StandardResponse<Witness[]>> {
    const q = protectedOnly ? `?protected=true` : "";
    return this.request<Witness[]>(`/witnesses${q}`);
  }

  async createWitness(data: {
    name: string;
    phone?: string;
    age?: number;
    identification_sign?: string;
    reliability: string;
    is_protected?: boolean;
    statement_summary?: string;
  }): Promise<StandardResponse<Witness>> {
    return this.request<Witness>("/witnesses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async listLocations(city?: string): Promise<StandardResponse<LocationItem[]>> {
    const q = city ? `?city=${encodeURIComponent(city)}` : "";
    return this.request<LocationItem[]>(`/locations${q}`);
  }

  async createLocation(data: {
    address: string;
    area: string;
    city: string;
    gps_coordinates?: string;
  }): Promise<StandardResponse<LocationItem>> {
    return this.request<LocationItem>("/locations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async linkSuspectToCase(case_id: number, participant_id: number, role_or_impact: string): Promise<StandardResponse<CaseSuspectLink>> {
    return this.request<CaseSuspectLink>(`/cases/${case_id}/suspects`, {
      method: "POST",
      body: JSON.stringify({ participant_id, role_or_impact }),
    });
  }

  async linkVictimToCase(case_id: number, participant_id: number, role_or_impact: string): Promise<StandardResponse<CaseVictimLink>> {
    return this.request<CaseVictimLink>(`/cases/${case_id}/victims`, {
      method: "POST",
      body: JSON.stringify({ participant_id, role_or_impact }),
    });
  }

  async linkWitnessToCase(case_id: number, participant_id: number, role_or_impact: string): Promise<StandardResponse<CaseWitnessLink>> {
    return this.request<CaseWitnessLink>(`/cases/${case_id}/witnesses`, {
      method: "POST",
      body: JSON.stringify({ participant_id, role_or_impact }),
    });
  }

  async linkLocationToCase(case_id: number, participant_id: number, role_or_impact: string): Promise<StandardResponse<CaseLocationLink>> {
    return this.request<CaseLocationLink>(`/cases/${case_id}/locations`, {
      method: "POST",
      body: JSON.stringify({ participant_id, role_or_impact }),
    });
  }

  // --- Evidence & Chain of Custody ---
  async listEvidence(case_id?: number, evidence_type?: string, status?: string): Promise<StandardResponse<Evidence[]>> {
    const params = new URLSearchParams();
    if (case_id) params.append("case_id", case_id.toString());
    if (evidence_type) params.append("evidence_type", evidence_type);
    if (status) params.append("status", status);
    const q = params.toString() ? `?${params.toString()}` : "";
    return this.request<Evidence[]>(`/evidence${q}`);
  }

  async getEvidence(id: number): Promise<StandardResponse<Evidence>> {
    return this.request<Evidence>(`/evidence/${id}`);
  }

  async createEvidence(data: {
    case_id: number;
    title: string;
    description?: string;
    evidence_type: string;
    storage_location?: string;
    collected_by_officer_id?: number;
  }): Promise<StandardResponse<Evidence>> {
    return this.request<Evidence>("/evidence", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEvidenceStatus(
    id: number,
    data: { status: string; storage_location?: string; remarks: string }
  ): Promise<StandardResponse<Evidence>> {
    return this.request<Evidence>(`/evidence/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async getEvidenceChainOfCustody(id: number): Promise<StandardResponse<EvidenceChainLog[]>> {
    return this.request<EvidenceChainLog[]>(`/evidence/${id}/chain`);
  }

  // --- Audit Logs ---
  async listAuditLogs(params?: {
    page?: number;
    page_size?: number;
    user_id?: number;
    branch_id?: number;
    event_type?: string;
    entity_type?: string;
    action?: string;
    result?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<StandardResponse<AuditLog[]>> {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", params.page.toString());
    if (params?.page_size) q.append("page_size", params.page_size.toString());
    if (params?.user_id) q.append("user_id", params.user_id.toString());
    if (params?.branch_id) q.append("branch_id", params.branch_id.toString());
    if (params?.event_type) q.append("event_type", params.event_type);
    if (params?.entity_type) q.append("entity_type", params.entity_type);
    if (params?.action) q.append("action", params.action);
    if (params?.result) q.append("result", params.result);
    if (params?.search) q.append("search", params.search);
    if (params?.from_date) q.append("from_date", params.from_date);
    if (params?.to_date) q.append("to_date", params.to_date);

    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return this.request<AuditLog[]>(`/admin/audit-logs${queryStr}`);
  }

  // --- Bangladesh Geography Reference Endpoints ---
  async getGeoDivisions(): Promise<StandardResponse<GeoDivision[]>> {
    return this.request<GeoDivision[]>("/geo/divisions");
  }

  async getGeoDistricts(divisionId?: number): Promise<StandardResponse<GeoDistrict[]>> {
    const q = divisionId ? `?division_id=${divisionId}` : "";
    return this.request<GeoDistrict[]>(`/geo/districts${q}`);
  }

  async getGeoUpazilas(districtId?: number): Promise<StandardResponse<GeoUpazila[]>> {
    const q = districtId ? `?district_id=${districtId}` : "";
    return this.request<GeoUpazila[]>(`/geo/upazilas${q}`);
  }

  async getGeoThanas(districtId?: number): Promise<StandardResponse<GeoThana[]>> {
    const q = districtId ? `?district_id=${districtId}` : "";
    return this.request<GeoThana[]>(`/geo/thanas${q}`);
  }

  // --- Complaint Intake & Public Portal ---
  async getComplaintCategories(): Promise<StandardResponse<ComplaintCategory[]>> {
    return this.request<ComplaintCategory[]>("/complaint-categories");
  }

  async submitPublicComplaint(data: {
    complainant_name: string;
    contact_phone: string;
    title: string;
    description: string;
    incident_date: string;
    incident_time?: string;
    approximate_time?: boolean;
    complaint_category_id?: number;
    receiving_branch_id?: number;
  }): Promise<StandardResponse<{ tracking_code: string; submitted_at: string; current_status: string; branch_name: string; acknowledgment: string }>> {
    return this.request("/public/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async trackPublicComplaint(trackingCode: string, phone: string): Promise<StandardResponse<PublicTrackResponse>> {
    const q = new URLSearchParams({ tracking_code: trackingCode, phone });
    return this.request<PublicTrackResponse>(`/public/complaints/track?${q.toString()}`);
  }

  async listComplaints(params?: {
    status?: string;
    branch_id?: number;
    category_id?: number;
    search?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<StandardResponse<Complaint[]>> {
    const q = new URLSearchParams();
    if (params?.status) q.append("status", params.status);
    if (params?.branch_id) q.append("branch_id", params.branch_id.toString());
    if (params?.category_id) q.append("category_id", params.category_id.toString());
    if (params?.search) q.append("search", params.search);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    if (params?.page) q.append("page", params.page.toString());
    if (params?.page_size) q.append("page_size", params.page_size.toString());

    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return this.request<Complaint[]>(`/complaints${queryStr}`);
  }

  async getComplaint(id: number): Promise<StandardResponse<Complaint>> {
    return this.request<Complaint>(`/complaints/${id}`);
  }

  async createOfficerComplaint(data: {
    complainant_id: number;
    submission_channel?: string;
    title: string;
    description: string;
    incident_date: string;
    incident_time?: string;
    approximate_time?: boolean;
    location_id?: number;
    complaint_category_id?: number;
    urgency?: string;
    receiving_branch_id: number;
    confidentiality_level?: string;
    internal_notes?: string;
  }): Promise<StandardResponse<Complaint>> {
    return this.request<Complaint>("/complaints", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async assessComplaint(
    id: number,
    data: {
      new_status: string;
      decision: string;
      reason: string;
      public_status_message?: string;
      internal_notes?: string;
      assigned_reviewer_id?: number;
    }
  ): Promise<StandardResponse<Complaint>> {
    return this.request<Complaint>(`/complaints/${id}/assess`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async transferComplaint(
    id: number,
    toBranchId: number,
    reason: string
  ): Promise<StandardResponse<string>> {
    return this.request<string>(`/complaints/${id}/transfer`, {
      method: "POST",
      body: JSON.stringify({ to_branch_id: toBranchId, reason }),
    });
  }

  async getComplaintHistory(id: number): Promise<StandardResponse<ComplaintStatusHistory[]>> {
    return this.request<ComplaintStatusHistory[]>(`/complaints/${id}/history`);
  }

  async getComplaintTransfers(id: number): Promise<StandardResponse<ComplaintTransferHistory[]>> {
    return this.request<ComplaintTransferHistory[]>(`/complaints/${id}/transfers`);
  }

  // Record Deletion Capabilities
  async deleteUser(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/users/${id}`, {
      method: "DELETE",
    });
  }

  async deleteCase(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/cases/${id}`, {
      method: "DELETE",
    });
  }

  async deleteComplaint(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/complaints/${id}`, {
      method: "DELETE",
    });
  }

  async deleteEvidence(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/evidence/${id}`, {
      method: "DELETE",
    });
  }

  async deleteGD(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/gds/${id}`, {
      method: "DELETE",
    });
  }

  async deleteFIR(id: number): Promise<StandardResponse<void>> {
    return this.request<void>(`/firs/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
