// ============================================================================
// ORCUS - Police Investigation & Case Tracking System
// TypeScript Domain Models matching Master 3NF Schema & SQL Views
// ============================================================================

export interface StandardResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
  pagination?: Pagination;
  request_id?: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  officer_id?: number;
  officer_name?: string;
  badge_no?: string;
  rank?: string;
  branch_id?: number;
  branch_name?: string;
  district?: string;
  roles: string[];
}

export interface AdminUserItem {
  user_id: number;
  username: string;
  officer_id?: number;
  officer_name?: string;
  badge_no?: string;
  rank?: string;
  branch_name?: string;
  district?: string;
  branches?: string[];
  branch_ids?: number[];
  role_ids?: number[];
  is_active: boolean;
  last_login_at?: string;
  failed_login_attempts: number;
  roles: string[];
}

export interface Role {
  role_id: number;
  role_name: string;
  description?: string;
}

export interface AgencyBranch {
  branch_id: number;
  branch_name: string;
  district: string;
  branch_code?: string;
  branch_name_bn?: string;
}

export interface Officer {
  officer_id: number;
  badge_no: string;
  first_name: string;
  last_name: string;
  rank: string;
  branch_id: number;
  branch_name?: string;
  district?: string;
}

export interface OfficerCaseload {
  officer_id: number;
  badge_no: string;
  officer_name: string;
  rank: string;
  branch_name: string;
  district: string;
  total_cases_assigned: number;
  active_cases: number;
  closed_cases: number;
}

export interface ComplainantContact {
  contact_id?: number;
  contact_type: "phone" | "email";
  contact_value: string;
  is_primary: boolean;
}

export interface Complainant {
  complainant_id: number;
  name: string;
  contacts?: ComplainantContact[];
}

export interface GD {
  gd_id: number;
  gd_number: string;
  branch_id?: number;
  branch_name?: string;
  gd_date: string;
  subject: string;
  current_status: string;
  incident_place?: string;
  complainant_id: number;
  complainant_name?: string;
  complainant_phone?: string;
  complaint_id?: number;
  created_by_user_id?: number;
  approved_by_user_id?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GDStatusHistory {
  history_id: number;
  gd_id: number;
  previous_status?: string;
  new_status: string;
  decision: string;
  reason?: string;
  acting_user_id?: number;
  acting_username?: string;
  created_at: string;
}

export interface LegalSection {
  section_id: number;
  section_code: string;
  section_title: string;
  description?: string;
}

export interface FIR {
  fir_id: number;
  fir_number: string;
  branch_id?: number;
  branch_name?: string;
  complainant_id?: number;
  complainant_name?: string;
  complainant_phone?: string;
  crime_category: string;
  current_status: string;
  place_of_occurrence?: string;
  incident_date?: string;
  incident_time?: string;
  filed_date: string;
  gd_id?: number;
  gd_number?: string;
  source_complaint_id?: number;
  source_type?: string;
  created_by_user_id?: number;
  approved_by_user_id?: number;
  approved_at?: string;
  created_at?: string;
  updated_at?: string;
  legal_sections?: LegalSection[];
}

export interface FIRStatusHistory {
  history_id: number;
  fir_id: number;
  previous_status?: string;
  new_status: string;
  decision: string;
  reason?: string;
  acting_user_id?: number;
  acting_username?: string;
  created_at: string;
}

export interface CaseOverview {
  case_id: number;
  case_title: string;
  case_status: "Open" | "Under Investigation" | "Pending Review" | "Closed" | "Reopened" | "Archived";
  status?: string;
  opened_date: string;
  assigned_date?: string;
  fir_number?: string;
  crime_category?: string;
  gd_number?: string;
  lead_officer_badge?: string;
  lead_officer_name?: string;
  lead_officer_rank?: string;
  branch_name?: string;
  district?: string;
  suspect_count: number;
  victim_count: number;
  witness_count: number;
  evidence_count: number;
}

export interface CaseStatusHistory {
  history_id: number;
  case_id: number;
  status: string;
  changed_at: string;
  remarks?: string;
  changed_by_user_id?: number;
  changed_by?: string;
}

export interface CaseSuspectLink {
  case_id: number;
  suspect_id: number;
  first_name: string;
  last_name: string;
  suspicion_level: "Low" | "Medium" | "High";
  status: string;
  identification_sign?: string;
  role_in_crime?: string;
  role_or_impact?: string;
}

export interface CaseVictimLink {
  case_id: number;
  victim_id: number;
  name: string;
  phone?: string;
  is_deceased: boolean;
  impact_type?: string;
  impact_description?: string;
}

export interface CaseWitnessLink {
  case_id: number;
  witness_id: number;
  name: string;
  reliability: string;
  is_protected: boolean;
  testimony_summary?: string;
}

export interface CaseLocationLink {
  case_id: number;
  location_id: number;
  address: string;
  area: string;
  city: string;
  gps_coordinates?: string;
  location_role: string;
}

export interface Evidence {
  evidence_id: number;
  case_id: number;
  evidence_no: number;
  title: string;
  description?: string;
  evidence_type: "Physical" | "Digital" | "Documentary" | "Biological" | "Forensic" | "Weapon" | "Narcotics" | "Other" | string;
  status: "Collected" | "In Lab Analysis" | "Stored in Vault" | "Presented in Court" | "Archived" | "Disposed" | string;
  collected_at: string;
  collected_by_officer_id?: number;
  storage_location?: string;
}

export interface EvidenceChainLog {
  evidence_id: number;
  case_id: number;
  case_title: string;
  evidence_no: number;
  evidence_title: string;
  evidence_type: string;
  storage_location?: string;
  history_id: number;
  logged_status: string;
  changed_at: string;
  remarks?: string;
  updated_by_username?: string;
  updated_by_officer?: string;
}

export interface CaseDossier {
  case: CaseOverview;
  status_history: CaseStatusHistory[];
  suspects: CaseSuspectLink[];
  victims: CaseVictimLink[];
  witnesses: CaseWitnessLink[];
  locations: CaseLocationLink[];
  evidence_items: Evidence[];
  evidence?: Evidence[];
  fir?: FIR;
  lead_officer?: Officer;
  legal_sections?: LegalSection[];
}

export interface DashboardOverview {
  active_cases_count: number;
  total_cases_count: number;
  pending_firs_count: number;
  evidence_count: number;
  total_officers_count: number;
  total_branches_count: number;
}

export interface CasePipeline {
  fir_id: number;
  fir_number: string;
  crime_category: string;
  filed_date: string;
  gd_number?: string;
  gd_date?: string;
  complainant_name?: string;
  applicable_legal_sections?: string;
  case_id?: number;
  case_title?: string;
  case_status?: string;
}

export interface Suspect {
  suspect_id: number;
  first_name: string;
  last_name: string;
  age?: number;
  date_of_birth?: string;
  identification_sign?: string;
  suspicion_level: "Low" | "Medium" | "High";
  status: string;
}

export interface SuspectDossierItem {
  suspect_id: number;
  suspect_name: string;
  age?: number;
  suspicion_level: string;
  suspect_status: string;
  identification_sign?: string;
  case_id: number;
  case_title: string;
  case_status: string;
  role_in_crime?: string;
}

export interface Victim {
  victim_id: number;
  name: string;
  phone?: string;
  age?: number;
  identification_sign?: string;
  condition_notes?: string;
  is_deceased: boolean;
}

export interface Witness {
  witness_id: number;
  name: string;
  phone?: string;
  age?: number;
  identification_sign?: string;
  reliability: string;
  is_protected: boolean;
  statement_summary?: string;
}

export interface LocationItem {
  location_id: number;
  gps_coordinates?: string;
  address: string;
  area: string;
  city: string;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface AuditLog {
  audit_id: number;
  request_id?: string;
  user_id?: number;
  username?: string;
  event_type: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  route: string;
  http_method: string;
  ip_address?: string;
  user_agent?: string;
  branch_id?: number;
  branch_name?: string;
  before_summary?: string;
  after_summary?: string;
  result: "SUCCESS" | "FAILED" | "BLOCKED" | string;
  created_at: string;
}

export interface ComplaintCategory {
  category_id: number;
  name_en: string;
  name_bn: string;
  description?: string;
  is_cognizable: boolean;
  created_at: string;
}

export interface Complaint {
  complaint_id: number;
  tracking_code: string;
  complainant_id: number;
  submission_channel: string;
  title: string;
  description: string;
  incident_date: string;
  incident_time?: string;
  approximate_time: boolean;
  location_id?: number;
  complaint_category_id?: number;
  urgency: string;
  receiving_branch_id: number;
  assigned_reviewer_id?: number;
  current_status: string;
  confidentiality_level: string;
  public_status_message?: string;
  internal_notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  closed_at?: string;
  created_by_user_id?: number;
  updated_at: string;
  version: number;

  complainant_name?: string;
  complainant_phone?: string;
  category_name?: string;
  branch_name?: string;
  reviewer_name?: string;
}

export interface ComplaintStatusHistory {
  history_id: number;
  complaint_id: number;
  previous_status?: string;
  new_status: string;
  decision: string;
  reason?: string;
  acting_user_id?: number;
  acting_branch_id?: number;
  created_at: string;
  acting_username?: string;
  acting_branch?: string;
}

export interface ComplaintTransferHistory {
  transfer_id: number;
  complaint_id: number;
  from_branch_id: number;
  to_branch_id: number;
  transfer_reason: string;
  transferred_by_user_id: number;
  transferred_at: string;
  from_branch_name?: string;
  to_branch_name?: string;
  transferred_by?: string;
}

export interface PublicTrackResponse {
  tracking_code: string;
  submission_date: string;
  current_status: string;
  public_status_message: string;
  receiving_branch: string;
  contact_phone: string;
  last_updated: string;
}

export interface GeoDivision {
  division_id: number;
  name_en: string;
  name_bn: string;
  code: string;
}

export interface GeoDistrict {
  district_id: number;
  division_id: number;
  name_en: string;
  name_bn: string;
  code: string;
}

export interface GeoUpazila {
  upazila_id: number;
  district_id: number;
  name_en: string;
  name_bn: string;
}

export interface GeoThana {
  thana_id: number;
  district_id: number;
  name_en: string;
  name_bn: string;
  code?: string;
}

