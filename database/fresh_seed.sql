-- ============================================================================
-- ORCUS Police Investigation Management System - Fresh Production-Grade Seed Data
-- Designed for Academic DBMS Project Final Demonstration & Evaluation (Summer 2026)
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- Database     : orcus_db
-- Normalized   : 3NF Compliant with strict Foreign Keys, Triggers & Views
-- ============================================================================

USE orcus_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- TRUNCATE TRANSACTION AND OPERATIONAL TABLES
-- ----------------------------------------------------------------------------
TRUNCATE TABLE audit_log;
TRUNCATE TABLE case_assignment_history;
TRUNCATE TABLE case_location;
TRUNCATE TABLE case_status_history;
TRUNCATE TABLE case_suspect;
TRUNCATE TABLE case_victim;
TRUNCATE TABLE case_witness;
TRUNCATE TABLE victim_evidence;
TRUNCATE TABLE victim_location;
TRUNCATE TABLE evidence_status_history;
TRUNCATE TABLE evidence;
TRUNCATE TABLE investigation_activity;
TRUNCATE TABLE `case`;
TRUNCATE TABLE fir_legal_section;
TRUNCATE TABLE fir_status_history;
TRUNCATE TABLE fir;
TRUNCATE TABLE gd_status_history;
TRUNCATE TABLE gd;
TRUNCATE TABLE complaint_transfer_history;
TRUNCATE TABLE complaint_status_history;
TRUNCATE TABLE complaint;
TRUNCATE TABLE complainant_contact;
TRUNCATE TABLE complainant;
TRUNCATE TABLE witness;
TRUNCATE TABLE victim;
TRUNCATE TABLE suspect;
TRUNCATE TABLE location;
TRUNCATE TABLE user_role;
TRUNCATE TABLE `user`;
TRUNCATE TABLE officer_branch;
TRUNCATE TABLE officer;
TRUNCATE TABLE agency_branch;
TRUNCATE TABLE system_sequence;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. AGENCY BRANCHES (5 Strategic Regional Commands in Bangladesh)
-- ============================================================================
INSERT INTO agency_branch (branch_id, branch_name, name_bn, branch_code, branch_type, district, division_id, district_id, thana_id, contact_number, is_active) VALUES
(1, 'Central Headquarters', 'কেন্দ্রীয় পুলিশ সদর দপ্তর', 'BR-DHK-MOT', 'Metropolitan Division', 'Dhaka', 1, 1, 1, '+8802223381001', 1),
(2, 'Port Zone Regional Office', 'বন্দর অঞ্চল আঞ্চলিক কার্যালয়', 'BR-CTG-KOT', 'Specialized Unit', 'Chattogram', 2, 4, 10, '+88031612001', 1),
(3, 'Northeast Division Station', 'উত্তর-পূর্ব বিভাগীয় স্টেশন', 'BR-SYL-KOT', 'Regional Command', 'Sylhet', 6, 8, 11, '+880821715001', 1),
(4, 'Northern Regional Branch', 'উত্তর আঞ্চলিক শাখা', 'BR-RAJ-MOT', 'District Station', 'Rajshahi', 3, 6, NULL, '+880721770001', 1),
(5, 'Southwest Maritime Wing', 'দক্ষিণ-পশ্চিম মেরিটাইম উইং', 'BR-KHL-KOT', 'Maritime Wing', 'Khulna', 4, 7, NULL, '+88041720001', 1);

-- ============================================================================
-- 2. OFFICERS (Academic Group Members & Elite Bangladesh Police Investigators)
-- ============================================================================
INSERT INTO officer (officer_id, badge_no, first_name, last_name, rank, branch_id) VALUES
(1, 'ORC-1001', 'Arafat', 'Faisal', 'Chief Inspector', 1),
(2, 'ORC-1002', 'Shakil', 'Hossain', 'Senior Detective', 1),
(3, 'ORC-1003', 'Ayshee', 'Liza', 'Forensic Lead Specialist', 1),
(4, 'ORC-2001', 'Tariq', 'Ahmed', 'Inspector', 2),
(5, 'ORC-2002', 'Nusrat', 'Jahan', 'Sub-Inspector', 2),
(6, 'ORC-3001', 'Mahmudur', 'Rahman', 'Detective Sergeant', 3),
(7, 'ORC-4001', 'Kamrul', 'Hasan', 'Cybercrime Investigator', 4),
(8, 'ORC-5001', 'Farhana', 'Kabir', 'Field Intelligence Officer', 5);

-- ============================================================================
-- 2B. OFFICER BRANCH JUNCTION (Multi-Branch Postings & Assignments)
-- ============================================================================
INSERT INTO officer_branch (officer_id, branch_id, is_primary, assigned_at) VALUES
(1, 1, 1, NOW()), -- Faisal: HQ
(1, 2, 0, NOW()), -- Faisal cross-assigned to Port Zone
(1, 3, 0, NOW()), -- Faisal cross-assigned to Sylhet
(2, 1, 1, NOW()), -- Shakil: HQ
(2, 3, 0, NOW()), -- Shakil cross-assigned to Sylhet
(3, 1, 1, NOW()), -- Liza: HQ Lab & Vaults
(4, 2, 1, NOW()), -- Tariq: Port Zone
(5, 2, 1, NOW()), -- Nusrat: Central Intake / Patrol
(6, 3, 1, NOW()), -- Mahmud: Northeast Division (Sylhet)
(7, 4, 1, NOW()), -- Kamrul: Northern Regional (Rajshahi)
(8, 5, 1, NOW()); -- Farhana: Southwest Maritime Wing (Khulna)

-- ============================================================================
-- 3. USERS (Application User Accounts with bcrypt placeholders)
-- ============================================================================
INSERT INTO `user` (user_id, username, password_hash, officer_id, is_active, failed_login_attempts) VALUES
(1, 'admin_faisal',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 1, 1, 0),
(2, 'det_shakil',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 2, 1, 0),
(3, 'forensic_liza',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 3, 1, 0),
(4, 'insp_tariq',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 4, 1, 0),
(5, 'si_nusrat',         '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 5, 1, 0),
(6, 'det_mahmud',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 6, 1, 0),
(7, 'cyber_kamrul',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 7, 1, 0),
(8, 'intel_farhana',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 8, 1, 0),
(9, 'system_auditor',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 1, 0),
(10, 'complainant_rahim','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL, 1, 0);

-- ============================================================================
-- 4. USER ROLES (Standardized RBAC Mapping)
-- ============================================================================
INSERT INTO user_role (user_id, role_id) VALUES
(1, 1),  -- admin_faisal -> Administrator
(2, 2),  -- det_shakil -> Lead Investigator
(2, 9),  -- det_shakil -> Investigating Officer
(3, 4),  -- forensic_liza -> Forensic Specialist
(3, 10), -- forensic_liza -> Evidence Officer
(4, 2),  -- insp_tariq -> Lead Investigator
(4, 8),  -- insp_tariq -> Officer-in-Charge
(5, 7),  -- si_nusrat -> Duty Officer
(5, 3),  -- si_nusrat -> Field Detective
(6, 9),  -- det_mahmud -> Investigating Officer
(7, 14), -- cyber_kamrul -> Cyber Forensics Specialist
(7, 9),  -- cyber_kamrul -> Investigating Officer
(8, 11), -- intel_farhana -> Supervising Officer
(9, 5),  -- system_auditor -> System Auditor
(10, 13);-- complainant_rahim -> Public Complainant

-- ============================================================================
-- 5. GEOGRAPHICAL LOCATIONS (Crime Scenes, Drop Points, Facilities)
-- ============================================================================
INSERT INTO location (location_id, gps_coordinates, address, area, city, division_id, district_id, thana_id, postal_code, latitude, longitude) VALUES
(1, '23.7937, 90.4066', 'House 42, Road 11, Block D', 'Banani', 'Dhaka', 1, 1, 3, '1213', 23.7937000, 90.4066000),
(2, '22.3168, 91.8021', 'Container Yard Gate 4, Jetty Berth 9', 'Port Area', 'Chattogram', 2, 4, 10, '4100', 22.3168000, 91.8021000),
(3, '23.7925, 90.4167', 'Gulshan Avenue Tower, Level 14', 'Gulshan-2', 'Dhaka', 1, 1, 3, '1212', 23.7925000, 90.4167000),
(4, '24.3636, 88.6241', 'Regional SCADA Control Substation 4', 'Motihar', 'Rajshahi', 3, 6, NULL, '6204', 24.3636000, 88.6241000),
(5, '25.1764, 92.0125', 'Tamabil Land Port Customs Gate', 'Jaflong', 'Sylhet', 6, 8, 11, '3151', 25.1764000, 92.0125000),
(6, '23.7272, 90.4093', 'Motijheel Commercial Area, BBL Tower', 'Motijheel', 'Dhaka', 1, 1, 1, '1000', 23.7272000, 90.4093000),
(7, '22.8456, 89.5403', 'Rupsha Ferry Ghat Terminal, Khulna Port', 'Rupsha', 'Khulna', 4, 7, NULL, '9240', 22.8456000, 89.5403000),
(8, '23.7465, 90.3760', 'Dhanmondi Lake Walkway near Road 32', 'Dhanmondi', 'Dhaka', 1, 1, 2, '1209', 23.7465000, 90.3760000);

-- ============================================================================
-- 6. COMPLAINANTS & CONTACTS (Real-World Bangladeshi Citizens & Organizations)
-- ============================================================================
INSERT INTO complainant (complainant_id, name) VALUES
(1, 'Dr. Rafiqul Islam, MBBS, FCPS'),
(2, 'Shahidul Alam Chowdhury (Executive Director, Bay Shipping)'),
(3, 'Syeda Tasnim Begum'),
(4, 'Apex Cyber Defense Ltd (Rep: Kazi Anisur Rahman)'),
(5, 'Engineer Nasreen Akter (Executive Director, Northern PGCB)'),
(6, 'Rahim Uddin Patwary (Trader, Chawkbazar)'),
(7, 'Begum Meherunnesa Chowdhury (Senior Lecturer)'),
(8, 'Tanvir Mahmud Sadek (FinTech Operations Lead)');

INSERT INTO complainant_contact (contact_id, complainant_id, contact_type, contact_value, is_primary) VALUES
(1, 1, 'phone', '+8801711000111', 1),
(2, 1, 'email', 'dr.rafiqul.islam@med-dhaka.org', 0),
(3, 2, 'phone', '+8801819222333', 1),
(4, 2, 'email', 'shahidul@bayshipping-ctg.com', 0),
(5, 3, 'phone', '+8801912444555', 1),
(6, 3, 'email', 'tasnim.begum92@gmail.com', 0),
(7, 4, 'phone', '+8801615666777', 1),
(8, 4, 'email', 'secops@apexdefense.com.bd', 0),
(9, 5, 'phone', '+8801518888999', 1),
(10, 5, 'email', 'director.grid@pgcb.gov.bd', 0),
(11, 6, 'phone', '+8801711223344', 1),
(12, 7, 'phone', '+8801922334455', 1),
(13, 8, 'phone', '+8801833445566', 1);

-- ============================================================================
-- 7. COMPLAINTS (Citizen Submissions & Officer Field Intakes)
-- ============================================================================
INSERT INTO complaint (complaint_id, tracking_code, complainant_id, submission_channel, title, description, incident_date, incident_time, approximate_time, location_id, complaint_category_id, urgency, receiving_branch_id, assigned_reviewer_id, current_status, confidentiality_level, public_status_message, internal_notes, submitted_at, reviewed_at, created_by_user_id, version) VALUES
(1, 'CMP-2026-0801', 4, 'Online Citizen Portal', 'Unauthorized Exfiltration and Swift Intercept of Corporate Funds', 'Multiple spoofed SWIFT transaction queries originating from an IP masquerading as Bangladesh Bank gateway resulting in attempted siphon of 45,000,000 BDT.', '2026-07-01', '03:15:00', 0, 6, 2, 'Critical', 1, 1, 'Converted to FIR', 'Restricted', 'Complaint verified and converted to official First Information Report (FIR-2026-0101). Formal investigation underway.', 'Critical cyber theft vector; coordination with CID Cyber Centre active.', '2026-07-01 04:30:00', '2026-07-01 08:00:00', 1, 2),

(2, 'CMP-2026-0802', 2, 'Officer Entry', 'Seals Broken on Heavy Machinery Container at Jetty Berth 9', 'Customs bond warehouse officer observed tampering of digital seal and unauthorized offloading of military-grade night optics and tactical hardware.', '2026-07-04', '22:45:00', 0, 2, 4, 'High', 2, 4, 'Converted to FIR', 'Confidential', 'Customs and Port Police have filed First Information Report (FIR-2026-0102). Consignment impounded.', 'Customs Intelligence joined port raid taskforce.', '2026-07-05 06:15:00', '2026-07-05 09:30:00', 4, 2),

(3, 'CMP-2026-0803', 1, 'Emergency Hotline', 'Armed Extortion and Threat to Life by Gang Demanding 20M BDT', 'Unidentified cartel calling from encrypted VoIP numbers demanding 20,000,000 BDT protection cash. Suspects fired two warning shots at complainant personal vehicle in Gulshan.', '2026-07-10', '19:20:00', 0, 3, 3, 'Critical', 1, 2, 'Converted to FIR', 'Confidential', 'FIR registered (FIR-2026-0103) under Penal Code sections 384 & 120B. Armed protection detail assigned to victim.', 'Audio recordings submitted for voice biometric matching.', '2026-07-10 20:05:00', '2026-07-10 21:00:00', 2, 2),

(4, 'CMP-2026-0804', 5, 'Online Citizen Portal', 'SCADA Supervisory Control Intrusion at Regional Substation 4', 'Ransomware deployment attempted on substation RTU switches. Grid operators locked out of sub-transmission feeders for 34 minutes during peak demand.', '2026-07-20', '01:40:00', 0, 4, 2, 'Critical', 4, 7, 'Converted to FIR', 'Restricted', 'Case converted into FIR-2026-0105. Digital forensics unit analyzing server memory snapshots.', 'Possible foreign threat actor utilizing zero-day privilege escalation.', '2026-07-20 03:00:00', '2026-07-20 07:15:00', 7, 2),

(5, 'CMP-2026-0805', 6, 'Police Station Walk-in', 'Burglary and Theft of High-Purity Precious Metal Bars', 'Break-in at wholesale jewelry storage facility in Chawkbazar. Safes cut with industrial gas torches; estimated loss 18,500,000 BDT.', '2026-07-25', '02:00:00', 1, 1, 5, 'High', 1, 5, 'Converted to GD', 'Standard', 'General Diary logged as GD-DHK-2026-0094. Physical crime scene examination in progress.', 'Forensics lifted 4 partial fingerprints from vault hinges.', '2026-07-25 09:10:00', '2026-07-25 10:45:00', 5, 2),

(6, 'CMP-2026-0806', 7, 'Online Citizen Portal', 'Targeted Phishing and Online Impersonation on Social Media', 'Fraudulent clone profiles soliciting urgent donations from university alumni in complainant name.', '2026-08-01', '14:30:00', 0, 8, 2, 'Medium', 1, 5, 'Under Review', 'Standard', 'Your complaint has been received and is being verified by Duty Officer SI Nusrat Jahan.', 'Reviewing IP headers provided by complainant.', '2026-08-01 16:00:00', '2026-08-01 17:30:00', 5, 1),

(7, 'CMP-2026-0807', 3, 'Police Station Walk-in', 'Armed Assault and Gold Chain Snatching in Sylhet Outskirts', 'Two motorcycle riders armed with machetes cornered complainant vehicle and snatched jewelry and handbag containing land title deeds.', '2026-08-05', '18:15:00', 0, 5, 1, 'High', 3, 6, 'Converted to GD', 'Standard', 'GD-SYL-2026-0044 recorded. Patrol teams alerted across Jaflong highway.', 'Highway CCTV camera footage being requisitioned.', '2026-08-05 19:40:00', '2026-08-05 20:30:00', 6, 2),

(8, 'CMP-2026-0808', 8, 'Online Citizen Portal', 'Mobile Financial Service (MFS) Wallet SIM-Swap Hijacking', 'Over 850,000 BDT drained across 43 automated bKash/Nagad transactions following unauthorized SIM reissue by local telecom vendor.', '2026-08-12', '11:00:00', 0, 1, 2, 'High', 1, 7, 'Submitted', 'Standard', 'Complaint received. Pending review by Cyber Forensics Division.', 'Telecommunication operator log requests prepared.', '2026-08-12 12:30:00', NULL, 7, 1),
(9, 'CMP-BR-DHK-GUL-2026-000000', 3, 'Police Station Walk-in', 'Illegal Cross-Border Syndicate Smuggling & Extortion', 'Armed cartel operating along regional borders engaging in systematic cross-border contraband logistics, extortion, and firearm deployment.', '2026-08-10', '14:00:00', 0, 5, 4, 'Critical', 3, 6, 'Converted to FIR', 'Restricted', 'Complaint formally verified and elevated to First Information Report at Northeast Regional Command.', 'High priority organized cross-border criminal file.', '2026-08-10 15:30:00', '2026-08-10 16:30:00', 1, 2);

-- Complaint Status History
INSERT INTO complaint_status_history (history_id, complaint_id, previous_status, new_status, decision, reason, acting_user_id, acting_branch_id, created_at) VALUES
(1, 1, 'Submitted', 'Under Review', 'Accepted for Verification', 'High value financial fraud requires immediate cyber review.', 1, 1, '2026-07-01 05:00:00'),
(2, 1, 'Under Review', 'Converted to FIR', 'Approved for FIR Registration', 'Cognizable offense under Cyber Security Act & Penal Code 420.', 1, 1, '2026-07-01 08:00:00'),
(3, 2, 'Submitted', 'Converted to FIR', 'Direct FIR Filing', 'Port container tampering with contraband indicators.', 4, 2, '2026-07-05 09:30:00'),
(4, 3, 'Submitted', 'Converted to FIR', 'Immediate FIR Filing', 'Active death threats and firearm discharge warrant immediate police intervention.', 2, 1, '2026-07-10 21:00:00'),
(5, 4, 'Submitted', 'Converted to FIR', 'Elevated to National Threat FIR', 'Cyber attack against public power grid infrastructure.', 7, 4, '2026-07-20 07:15:00'),
(6, 5, 'Submitted', 'Converted to GD', 'GD Recorded for Scoping', 'Initial physical inspection required prior to formal charge filing.', 5, 1, '2026-07-25 10:45:00'),
(7, 6, 'Submitted', 'Under Review', 'Assigned for Verification', 'Authenticating forged profiles and financial channels.', 5, 1, '2026-08-01 17:30:00'),
(8, 7, 'Submitted', 'Converted to GD', 'Recorded as Highway General Diary', 'Preliminary patrol dispatch and vehicle search bulletin issued.', 6, 3, '2026-08-05 20:30:00'),
(9, 9, 'Submitted', 'Under Review', 'Intake Review', 'Priority review by Sylhet regional command', 1, 3, '2026-08-10 15:45:00'),
(10, 9, 'Under Review', 'Converted to FIR', 'Approved for FIR Registration', 'Cognizable cross-border smuggling and extortion offenses verified', 1, 3, '2026-08-10 16:30:00');

-- ============================================================================
-- 8. GENERAL DIARY (GD Entries)
-- ============================================================================
INSERT INTO gd (gd_id, gd_number, branch_id, gd_date, subject, current_status, incident_place, created_by_user_id, approved_by_user_id, approved_at, complainant_id, complaint_id) VALUES
(1, 'GD-DHK-2026-0012', 1, '2026-07-01', 'Suspicious offshore wire transfer attempt from Apex Cyber corporate accounts via compromised Swift credentials.', 'Approved', 'Motijheel Commercial Area, Dhaka', 1, 1, '2026-07-01 07:30:00', 4, 1),
(2, 'GD-CTG-2026-0045', 2, '2026-07-05', 'Physical security breach and container seal destruction observed at Chattogram Port Terminal 3 Berth 9.', 'Approved', 'Container Yard Gate 4, Port Area, Chattogram', 4, 4, '2026-07-05 08:30:00', 2, 2),
(3, 'GD-DHK-2026-0089', 1, '2026-07-10', 'Extortion threats with automatic weapon fire targeting resident physician residence in Gulshan.', 'Approved', 'House 42, Road 11, Block D, Banani / Gulshan', 2, 1, '2026-07-10 20:30:00', 1, 3),
(4, 'GD-RAJ-2026-0034', 4, '2026-07-20', 'Supervisory network anomalous packets and blackout trigger at Rajshahi Regional Grid Substation.', 'Approved', 'Substation 4, Power Grid Colony, Motihar, Rajshahi', 7, 7, '2026-07-20 06:45:00', 5, 4),
(5, 'GD-DHK-2026-0094', 1, '2026-07-25', 'Theft of precious industrial gold bullions and cutter marks on heavy security vault doors.', 'Approved', 'Chawkbazar Commercial Zone, Dhaka', 5, 1, '2026-07-25 11:00:00', 6, 5),
(6, 'GD-SYL-2026-0044', 3, '2026-08-05', 'Armed highway robbery of personal jewelry and land deeds on Sylhet-Jaflong bypass.', 'Approved', 'Tamabil Highway Border Checkpoint, Sylhet', 6, 6, '2026-08-05 21:00:00', 3, 7);

INSERT INTO gd_status_history (history_id, gd_id, previous_status, new_status, decision, reason, acting_user_id, created_at) VALUES
(1, 1, 'Draft', 'Approved', 'GD Approved', 'Legitimate corporate cyber incident logged.', 1, '2026-07-01 07:30:00'),
(2, 2, 'Draft', 'Approved', 'GD Approved', 'Customs inspection report corroborated seal violation.', 4, '2026-07-05 08:30:00'),
(3, 3, 'Draft', 'Approved', 'GD Approved', 'Urgent armed incident logged with priority flag.', 1, '2026-07-10 20:30:00'),
(4, 4, 'Draft', 'Approved', 'GD Approved', 'Substation logs confirm network breach.', 7, '2026-07-20 06:45:00'),
(5, 5, 'Draft', 'Approved', 'GD Approved', 'Site verified by patrol officer.', 1, '2026-07-25 11:00:00'),
(6, 6, 'Draft', 'Approved', 'GD Approved', 'Victim report verified at Sylhet Kotwali Thana.', 6, '2026-08-05 21:00:00');

-- ============================================================================
-- 9. FIRST INFORMATION REPORTS (FIRs)
-- ============================================================================
INSERT INTO fir (fir_id, fir_number, branch_id, complainant_id, crime_category, current_status, place_of_occurrence, incident_date, incident_time, created_by_user_id, approved_by_user_id, approved_at, filed_date, gd_id, source_complaint_id, source_type) VALUES
(1, 'FIR-2026-0101', 1, 4, 'Financial Cyber Fraud', 'Registered', 'Motijheel Commercial Area, BBL Tower', '2026-07-01', '03:15:00', 1, 1, '2026-07-03 09:00:00', '2026-07-03', 1, 1, 'Converted from GD'),
(2, 'FIR-2026-0102', 2, 2, 'Organized Maritime Smuggling', 'Registered', 'Chattogram Port Terminal 3 Berth 9', '2026-07-04', '22:45:00', 4, 4, '2026-07-08 11:30:00', '2026-07-08', 2, 2, 'Converted from GD'),
(3, 'FIR-2026-0103', 1, 1, 'Armed Extortion & Kidnapping Threat', 'Registered', 'Gulshan Avenue Commercial Complex & Banani', '2026-07-10', '19:20:00', 2, 1, '2026-07-12 14:00:00', '2026-07-12', 3, 3, 'Converted from GD'),
(4, 'FIR-2026-0104', 3, 3, 'Counterfeit Currency Syndicate', 'Registered', 'Tamabil Highway Border Checkpoint, Sylhet', '2026-07-17', '16:00:00', 6, 1, '2026-07-18 10:00:00', '2026-07-18', NULL, 9, 'Converted from Complaint'),
(5, 'FIR-2026-0105', 4, 5, 'Critical Infrastructure Cyber Attack', 'Registered', 'Regional SCADA Control Substation 4, Motihar', '2026-07-20', '01:40:00', 7, 7, '2026-07-22 12:00:00', '2026-07-22', 4, 4, 'Converted from GD');

-- FIR Legal Section Mapping
INSERT INTO fir_legal_section (fir_id, section_id) VALUES
(1, 1), -- FIR-0101: BPC-420 (Fraud & Cheating)
(1, 4), -- FIR-0101: BPC-120B (Criminal Conspiracy)
(1, 5), -- FIR-0101: CSA-17 (Cyber Sabotage & Critical Info)
(2, 4), -- FIR-0102: BPC-120B (Criminal Conspiracy)
(2, 6), -- FIR-0102: CA-156 (Customs Act Smuggling)
(3, 2), -- FIR-0103: BPC-384 (Extortion Punishment)
(3, 3), -- FIR-0103: BPC-395 (Gang Dacoity / Armed Robbery)
(3, 4), -- FIR-0103: BPC-120B (Criminal Conspiracy)
(4, 1), -- FIR-0104: BPC-420 (Fraud)
(4, 3), -- FIR-0104: BPC-395 (Dacoity / Syndicate)
(5, 5); -- FIR-0105: CSA-17 (Cyber Security Act - Critical Infra)

INSERT INTO fir_status_history (history_id, fir_id, previous_status, new_status, decision, reason, acting_user_id, created_at) VALUES
(1, 1, 'Draft', 'Registered', 'Formal Registration', 'Cognizable sections invoked under Penal Code & CSA.', 1, '2026-07-03 09:00:00'),
(2, 2, 'Draft', 'Registered', 'Formal Registration', 'Customs violation with international contraband nexus.', 4, '2026-07-08 11:30:00'),
(3, 3, 'Draft', 'Registered', 'Formal Registration', 'Armed criminal syndicate posing severe life hazard.', 1, '2026-07-12 14:00:00'),
(4, 4, 'Draft', 'Registered', 'Formal Registration', 'Direct raid yielded 40M counterfeit notes.', 1, '2026-07-18 10:00:00'),
(5, 5, 'Draft', 'Registered', 'Formal Registration', 'State power grid supervisory attack registered.', 7, '2026-07-22 12:00:00');

-- ============================================================================
-- 10. INVESTIGATION CASES
-- ============================================================================
INSERT INTO `case` (case_id, case_number, case_title, status, priority, opened_date, assigned_date, review_deadline, closure_date, closure_reason, reopen_reason, version, fir_id, lead_officer_id, lead_branch_id, supervising_officer_id, confidentiality_level) VALUES
(1, 'CAS-2026-0001', 'Operation Shadow Wire: Corporate Fund Exfiltration', 'Under Investigation', 'Critical', '2026-07-04', '2026-07-04', '2026-10-04', NULL, NULL, NULL, 1, 1, 1, 1, 1, 'Restricted'),
(2, 'CAS-2026-0002', 'Operation Kraken: Chittagong Port Contraband Syndicate', 'Under Investigation', 'High', '2026-07-09', '2026-07-10', '2026-10-10', NULL, NULL, NULL, 1, 2, 4, 2, 8, 'Confidential'),
(3, 'CAS-2026-0003', 'Operation Iron Shield: Gulshan Extortion Ring', 'Pending Review', 'Critical', '2026-07-13', '2026-07-14', '2026-09-30', NULL, NULL, NULL, 1, 3, 2, 1, 1, 'Confidential'),
(4, 'CAS-2026-0004', 'Operation Silver Mint: Counterfeit Currency Network', 'Closed', 'High', '2026-07-19', '2026-07-20', '2026-08-30', '2026-08-15', 'Full syndicate apprehended; 42.5M counterfeit BDT impounded; prosecution dossier submitted with unanimous conviction recommendation.', NULL, 1, 4, 6, 4, 1, 'Standard'),
(5, 'CAS-2026-0005', 'Operation Black Grid: Supervisory SCADA Malware Intrusion', 'Open', 'Critical', '2026-07-23', '2026-07-24', '2026-11-24', NULL, NULL, NULL, 1, 5, 7, 4, 8, 'Top Secret');

-- Case Status History
INSERT INTO case_status_history (history_id, case_id, status, changed_at, remarks, changed_by_user_id) VALUES
(1, 1, 'Open', '2026-07-04 09:00:00', 'Case opened following FIR-2026-0101 registration.', 1),
(2, 1, 'Under Investigation', '2026-07-04 11:30:00', 'Lead investigator Chief Inspector Faisal assigned.', 1),
(3, 2, 'Open', '2026-07-09 14:00:00', 'Maritime customs violation case registered at Port Zone.', 4),
(4, 2, 'Under Investigation', '2026-07-10 10:00:00', 'Inspector Tariq deployed to Berth 9; container impounded.', 4),
(5, 3, 'Open', '2026-07-13 16:00:00', 'High-priority extortion case opened following weapon discharge.', 2),
(6, 3, 'Under Investigation', '2026-07-14 09:30:00', 'Wiretap intercept logs and ballistic ballistics cataloged.', 2),
(7, 3, 'Pending Review', '2026-08-01 15:00:00', 'Primary suspects detained; complete charge sheet submitted to Metropolitan Public Prosecutor.', 2),
(8, 4, 'Open', '2026-07-19 08:00:00', 'Counterfeit currency network raid initiated in Rajshahi.', 6),
(9, 4, 'Under Investigation', '2026-07-20 12:00:00', 'Printing press raided; master intaglio plates recovered.', 6),
(10, 4, 'Closed', '2026-08-15 17:00:00', 'All 4 co-conspirators remanded to judicial custody; case closed.', 1),
(11, 5, 'Open', '2026-07-23 11:00:00', 'Incident response team deployed to regional grid substation.', 7);

-- Case Assignment History
INSERT INTO case_assignment_history (assignment_id, case_id, officer_id, assignment_role, assigned_by_user_id, assigned_at, effective_from, effective_to, status, handover_notes, transfer_reason, branch_id) VALUES
(1, 1, 1, 'Lead Investigator', 1, '2026-07-04 09:15:00', '2026-07-04 09:15:00', NULL, 'Active', 'Lead coordinator for forensic and banking transactions.', NULL, 1),
(2, 1, 2, 'Field Detective', 1, '2026-07-04 10:00:00', '2026-07-04 10:00:00', NULL, 'Active', 'Responsible for server room physical inspection and suspect tracking.', NULL, 1),
(3, 2, 4, 'Lead Investigator', 1, '2026-07-10 10:00:00', '2026-07-10 10:00:00', NULL, 'Active', 'Direct maritime container custody and interrogation.', NULL, 2),
(4, 2, 5, 'Field Detective', 4, '2026-07-10 11:00:00', '2026-07-10 11:00:00', NULL, 'Active', 'Handling customs manifest verification and vessel crew registry.', NULL, 2),
(5, 3, 2, 'Lead Investigator', 1, '2026-07-14 09:30:00', '2026-07-14 09:30:00', NULL, 'Active', 'Conducting surveillance on VoIP gateways and vehicle interception.', NULL, 1),
(6, 4, 6, 'Lead Investigator', 1, '2026-07-20 12:00:00', '2026-07-20 12:00:00', '2026-08-15 17:00:00', 'Inactive', 'Investigation successfully finalized.', 'Case Concluded', 4),
(7, 5, 7, 'Lead Investigator', 1, '2026-07-24 10:00:00', '2026-07-24 10:00:00', NULL, 'Active', 'Cyber incident lead analyzing kernel-level network telemetry.', NULL, 4);

-- ============================================================================
-- 11. SUSPECTS
-- ============================================================================
INSERT INTO suspect (suspect_id, first_name, last_name, age, date_of_birth, identification_sign, suspicion_level, status) VALUES
(1, 'Jubayer', 'Khan', 34, '1992-04-12', 'Scar across left eyebrow; wears dark aviator sunglasses', 'High', 'Under Investigation'),
(2, 'Monirul', 'Islam', 42, '1984-08-25', 'Dragon and anchor tattoo on right forearm', 'High', 'Arrested'),
(3, 'Shahriar', 'Haque', 29, '1997-02-18', 'Distinct mole under right eye; speaks fluent Cantonese & Bengali', 'Medium', 'Under Surveillance'),
(4, 'Delwar', 'Hossain', 51, '1975-11-03', 'Pronounced limp in left leg; burns on fingertips', 'High', 'Arrested'),
(5, 'Tanvir', 'Ahmed', 26, '2000-06-30', 'Slight speech stutter; wears rimless oval spectacles', 'Low', 'Interrogated'),
(6, 'Mustafizur', 'Rahman', 38, '1988-11-14', 'Deep burn scar on left palm; former telecom switch technician', 'High', 'Wanted');

-- ============================================================================
-- 12. VICTIMS
-- ============================================================================
INSERT INTO victim (victim_id, name, phone, age, identification_sign, condition_notes, is_deceased) VALUES
(1, 'Kazi Anisur Rahman & Apex Enterprise Board', '+8801615666777', NULL, 'Corporate entity and executive leadership', 'Direct financial loss of 45M BDT; severe operational reputational disruption', 0),
(2, 'Dr. Rafiqul Islam', '+8801711000111', 58, 'Grey hair, wire glasses', 'Acute psychological trauma and security threat following firearm discharge', 0),
(3, 'Zabir Ahmed (Port Crane Operator)', '+8801811999000', 32, 'Burn mark on right wrist', 'Assaulted with blunt weapon during container unauthorized offload; treated at CMCH', 0),
(4, 'Northern Power Grid Consumer Network (150K Citizens)', NULL, NULL, 'Public municipal infrastructure network', 'Substation blackout causing municipal water supply stoppage for 4 hours', 0),
(5, 'Rahim Uddin Patwary (Wholesale Merchant)', '+8801711223344', 49, 'Beard, traditional attire', 'Severe financial distress from 18.5M BDT bullion vault theft', 0);

-- ============================================================================
-- 13. WITNESSES
-- ============================================================================
INSERT INTO witness (witness_id, name, phone, age, identification_sign, reliability, is_protected, statement_summary) VALUES
(1, 'Moinul Ahsan', '+8801722334455', 45, 'Security uniform with badge', 'Reliable', 1, 'Eyewitness security supervisor who spotted suspect Toyota Hiace van entering terminal loading bay at 02:30 AM without clearance manifest.'),
(2, 'Sabrina Noor', '+8801933445566', 31, 'Corporate ID lanyard', 'Reliable', 0, 'Bank compliance analyst who noticed anomalous IP routing headers in the batch Swift transmission request.'),
(3, 'Abdul Karim', '+8801544556677', 62, 'White beard, prayer cap', 'Moderate', 0, 'Tea stall proprietor who heard loud arguments and gunfire near the Gulshan commercial alleyway before motorcycle sped off.'),
(4, 'Rasel Mia (Inside Informant)', '+8801855667788', 27, 'Tattoo on wrist', 'Reliable', 1, 'Confidential informant inside currency distribution ring who provided encrypted Telegram group chat logs and delivery schedule.'),
(5, 'Engineer Farhan Sadik', '+8801766778899', 36, 'Safety helmet, glasses', 'Reliable', 0, 'SCADA senior engineer who observed unexpected outbound SSH tunnel from substation terminal to external Romanian IP address.');

-- ============================================================================
-- 14. BRIDGE TABLES: PARTICIPANTS & LOCATIONS PER CASE
-- ============================================================================
-- Case <-> Suspect
INSERT INTO case_suspect (case_id, suspect_id, role_in_crime) VALUES
(1, 1, 'Principal Hacker / Swift Packet Manipulator'),
(1, 3, 'Account Mule / Beneficiary Account Operator'),
(2, 2, 'Maritime Syndicate Logistics Coordinator'),
(2, 4, 'Contraband Financier and Port Customs Insider'),
(3, 1, 'VoIP Extortion Caller and Intimidation Leader'),
(3, 4, 'Arms Supplier and Vehicle Provider'),
(4, 4, 'Master Counterfeiter and Plate Engraver'),
(4, 5, 'Regional Distribution Courier'),
(5, 1, 'Remote Exploitation Operator'),
(5, 6, 'Physical Rogue Hardware Implant Specialist');

-- Case <-> Victim
INSERT INTO case_victim (case_id, victim_id, impact_type) VALUES
(1, 1, 'Direct Financial Exfiltration Victim'),
(2, 3, 'Physical Assault and Threat Victim'),
(3, 2, 'Primary Extortion Target and Armed Threat'),
(5, 4, 'Critical Municipal Power Supply Disruption');

-- Case <-> Witness
INSERT INTO case_witness (case_id, witness_id, testimony_summary) VALUES
(1, 2, 'Verified unauthorized login timestamps matched suspect ISP routing logs.'),
(2, 1, 'Observed contraband offloading into unmarked freight trucks at Berth 9.'),
(3, 3, 'Witnessed motorcycle drive-by shooting in Gulshan alleyway.'),
(3, 4, 'Provided decryption keys for syndicate encrypted chat logs.'),
(4, 4, 'Supplied delivery schedule and Rajshahi press safehouse location.'),
(5, 5, 'Detected malicious SSH tunnel during active SCADA substation intrusion.');

-- Case <-> Location
INSERT INTO case_location (case_id, location_id, location_role) VALUES
(1, 1, 'Suspect Staging Safehouse (Banani)'),
(1, 6, 'Primary Incident Crime Scene (Motijheel Bank)'),
(2, 2, 'Seizure & Incident Location (Port Area)'),
(3, 1, 'Extortion Surveillance Point (Banani)'),
(3, 3, 'Armed Discharge Incident Scene (Gulshan Tower)'),
(4, 4, 'Printing Press Safehouse (Motihar)'),
(5, 4, 'Sabotage Site (Regional SCADA Substation 4)');

-- Victim <-> Location
INSERT INTO victim_location (victim_id, location_id) VALUES
(1, 6),
(2, 3),
(3, 2),
(4, 4),
(5, 1);

-- ============================================================================
-- 15. EVIDENCE (Weak Entity under CASE)
-- ============================================================================
INSERT INTO evidence (evidence_id, case_id, evidence_no, evidence_ref, title, description, packaging_ref, seal_ref, evidence_type, status, confidentiality_level, collected_at, collected_by_officer_id, storage_location, digital_hash, is_archived, version) VALUES
(1, 1, 1, 'EV-2026-0001-01', 'Encrypted 128GB SanDisk USB Flash Drive', 'Seized from suspect workstation at Banani office; contains banking Trojan scripts and keylogger dumps.', 'Anti-Static Bag #A12', 'SEAL-DHK-0091', 'Digital', 'In Lab Analysis', 'Restricted', '2026-07-04 14:00:00', 1, 'Digital Forensics Lab - Locker D1', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 0, 1),

(2, 1, 2, 'EV-2026-0001-02', 'Forged Corporate Fund Release Authorization Letter', 'Counterfeit letterhead with simulated CEO signature and forged Bangladesh Bank routing stamps.', 'Tamper-Evident Envelope #T88', 'SEAL-DHK-0092', 'Documentary', 'Stored in Vault', 'Standard', '2026-07-05 10:30:00', 2, 'Evidence Vault A - Shelf 3', NULL, 0, 1),

(3, 2, 1, 'EV-2026-0002-01', 'Seized Smuggling Container #MSKU-998241', 'Forty-foot shipping container containing undeclared military night-vision optics and covert surveillance bugs.', 'Customs Container Seal Locked', 'SEAL-CTG-5512', 'Physical', 'Stored in Vault', 'Confidential', '2026-07-10 16:45:00', 4, 'Port Seizure Holding Bay 2', NULL, 0, 1),

(4, 2, 2, 'EV-2026-0002-02', 'Satellite Phone (Iridium Extreme 9575)', 'Recovered from syndicate courier vessel; contains stored speed-dials to overseas smuggling cartel handlers.', 'Faraday Shielding Pouch #F03', 'SEAL-CTG-5513', 'Digital', 'In Lab Analysis', 'Restricted', '2026-07-11 11:20:00', 4, 'Digital Forensics Lab - Locker D2', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', 0, 1),

(5, 3, 1, 'EV-2026-0003-01', 'Recorded Extortion Voicemail and VoIP Audio Packets', 'WAV and PCAP files capturing caller demanding 20,000,000 BDT and threatening physical family elimination.', 'Write-Protected Optical Disc #CD-04', 'SEAL-DHK-1014', 'Digital', 'Presented in Court', 'Confidential', '2026-07-14 11:00:00', 2, 'Court Exhibit Evidence Safe #1', '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 0, 1),

(6, 3, 2, 'EV-2026-0003-02', '9mm Beretta 92FS Semi-Automatic Pistol w/ Suppressor', 'Recovered from suspect vehicle during Gulshan interception; serial numbers partially ground off; loaded with 11 hollow-point rounds.', 'Heavy Polymer Gun Case #G09', 'SEAL-DHK-1015', 'Weapon', 'Stored in Vault', 'Restricted', '2026-07-15 03:30:00', 2, 'Ballistics Vault - Locker W4', NULL, 0, 1),

(7, 4, 1, 'EV-2026-0004-01', 'Precision Intaglio Steel Printing Plates (1000 BDT)', 'Master engraved steel plates used to counterfeit genuine 1000 BDT notes with optical ink emulation.', 'Foam-Lined Metal Briefcase #M02', 'SEAL-RAJ-8821', 'Physical', 'Archived', 'Standard', '2026-07-20 18:00:00', 6, 'National Archives Secure Evidence Unit', NULL, 1, 1),

(8, 5, 1, 'EV-2026-0005-01', 'Forensic Bitstream Image of Substation SCADA Controller', 'Raw dd bitstream forensic image of Siemens Simatic RTU master unit capturing rootkit execution in memory.', 'Encrypted NVMe SSD in Faraday Case', 'SEAL-RAJ-9901', 'Forensic', 'In Lab Analysis', 'Top Secret', '2026-07-24 13:15:00', 7, 'Cyber Defense Sandbox VM-09', '01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b', 0, 1);

-- Evidence <-> Victim
INSERT INTO victim_evidence (victim_id, evidence_id) VALUES
(1, 1),
(1, 2),
(3, 3),
(2, 5),
(2, 6),
(4, 8);

-- ============================================================================
-- 16. EVIDENCE STATUS HISTORY (Complete Chain of Custody Audit Trail)
-- ============================================================================
INSERT INTO evidence_status_history (history_id, evidence_id, status, changed_at, remarks, changed_by_user_id, action, from_custodian_id, to_custodian_id, from_location, to_location, seal_condition, transfer_reason, request_ref) VALUES
(1, 1, 'Collected', '2026-07-04 14:00:00', 'Seized from suspect workstation during Banani raid.', 1, 'Initial Collection', NULL, 1, 'Banani Safehouse', 'HQ Reception Desk', 'Intact', 'Evidence Acquisition', 'REQ-EV-001'),
(2, 1, 'In Lab Analysis', '2026-07-05 09:30:00', 'Transferred to Lead Forensic Specialist Liza for hardware firmware hash extraction.', 3, 'Lab Transfer', 1, 3, 'HQ Reception Desk', 'Digital Forensics Lab - Locker D1', 'Intact', 'Firmware Analysis & Cryptographic Extraction', 'REQ-EV-002'),

(3, 2, 'Collected', '2026-07-05 10:30:00', 'Recovered from bank compliance record safe.', 2, 'Initial Collection', NULL, 2, 'Motijheel Bank', 'HQ Reception Desk', 'Intact', 'Forensic Document Inspection', 'REQ-EV-003'),
(4, 2, 'Stored in Vault', '2026-07-05 16:00:00', 'Handed to Evidence Custodian for climate-controlled vault preservation.', 3, 'Vault Transfer', 2, 3, 'HQ Reception Desk', 'Evidence Vault A - Shelf 3', 'Intact', 'Preservation awaiting judicial trial', 'REQ-EV-004'),

(5, 3, 'Collected', '2026-07-10 16:45:00', 'Impounded at Chattogram port berth under joint customs guard.', 4, 'Port Seizure', NULL, 4, 'Berth 9', 'Port Seizure Holding Bay 2', 'Intact', 'Contraband Interception', 'REQ-EV-005'),
(6, 3, 'Stored in Vault', '2026-07-11 08:00:00', 'Customs and police electronic seals applied; 24/7 armed perimeter established.', 4, 'Vault Transfer', 4, 4, 'Berth 9', 'Port Seizure Holding Bay 2', 'Intact', 'Court Trial Holding', 'REQ-EV-006'),

(7, 4, 'Collected', '2026-07-11 11:20:00', 'Recovered from vessel cabin.', 4, 'Initial Collection', NULL, 4, 'Vessel Bridge', 'Port Office Safe', 'Intact', 'Digital Seizure', 'REQ-EV-007'),
(8, 4, 'In Lab Analysis', '2026-07-12 14:00:00', 'Dispatched to Cyber Specialist Kamrul for satellite call register extraction.', 7, 'Lab Transfer', 4, 7, 'Port Office Safe', 'Digital Forensics Lab - Locker D2', 'Intact', 'Call Detail Record (CDR) Recovery', 'REQ-EV-008'),

(9, 5, 'Collected', '2026-07-14 11:00:00', 'Extracted from victim mobile device and carrier gateway.', 2, 'Initial Collection', NULL, 2, 'Gulshan Residence', 'HQ Cyber Station', 'Intact', 'Audio Evidence Seizure', 'REQ-EV-009'),
(10, 5, 'In Lab Analysis', '2026-07-16 10:00:00', 'Acoustic voice biometric analysis matched 98.7% with suspect Jubayer Khan.', 3, 'Lab Transfer', 2, 3, 'HQ Cyber Station', 'Audio Forensics Suite', 'Intact', 'Voice Biometrics Matching', 'REQ-EV-010'),
(11, 5, 'Presented in Court', '2026-07-30 14:30:00', 'Formally entered into evidence at Dhaka Metropolitan Sessions Court as Exhibit P-1.', 1, 'Court Presentation', 3, 1, 'Audio Forensics Suite', 'Court Exhibit Evidence Safe #1', 'Intact', 'Judicial Admission by Magistrate', 'REQ-EV-011'),

(12, 6, 'Collected', '2026-07-15 03:30:00', 'Recovered during armed vehicle intercept in Gulshan.', 2, 'Initial Collection', NULL, 2, 'Gulshan Avenue', 'HQ Ballistics Desk', 'Intact', 'Weapon Seizure', 'REQ-EV-012'),
(13, 6, 'Stored in Vault', '2026-07-15 11:00:00', 'Ballistic rifling marks matched shell casings recovered at scene; stored in vault.', 3, 'Vault Transfer', 2, 3, 'HQ Ballistics Desk', 'Ballistics Vault - Locker W4', 'Intact', 'Secure Ballistics Custody', 'REQ-EV-013'),

(14, 7, 'Collected', '2026-07-20 18:00:00', 'Seized from clandestine basement printing press.', 6, 'Initial Collection', NULL, 6, 'Motihar Safehouse', 'Rajshahi Station Safe', 'Intact', 'Raid Seizure', 'REQ-EV-014'),
(15, 7, 'Archived', '2026-08-16 10:00:00', 'Case closed following judicial conviction decree; plates deactivated and archived.', 1, 'Archive Transfer', 6, 1, 'Rajshahi Station Safe', 'National Archives Secure Evidence Unit', 'Intact', 'Final Post-Conviction Archival', 'REQ-EV-015'),

(16, 8, 'Collected', '2026-07-24 13:15:00', 'Live RAM snapshot and flash drive dump taken from SCADA controller.', 7, 'Initial Collection', NULL, 7, 'Substation 4', 'Cyber Sandbox VM-09', 'Intact', 'Critical Infrastructure Incident Response', 'REQ-EV-016'),
(17, 8, 'In Lab Analysis', '2026-07-25 09:00:00', 'Decompiling malware payload in isolated sandbox.', 7, 'Lab Transfer', 7, 7, 'Cyber Sandbox VM-09', 'Cyber Defense Sandbox VM-09', 'Intact', 'Reverse Engineering & Exploit Profiling', 'REQ-EV-017');

-- ============================================================================
-- 17. INVESTIGATION ACTIVITIES (Case Log Entries & Interrogations)
-- ============================================================================
INSERT INTO investigation_activity (activity_id, case_id, activity_type, title, description, occurred_at, recorded_at, recorded_by_user_id, officer_id, branch_id, visibility, status, version) VALUES
(1, 1, 'Interrogation', 'Interrogation of Primary Suspect Jubayer Khan', 'Suspect confessed to receiving encrypted routing scripts via ProtonMail from an IP in Eastern Europe. Admitted opening 4 bank accounts under forged NIDs.', '2026-07-06 14:00:00', '2026-07-06 16:30:00', 1, 1, 1, 'Internal', 'Active', 1),
(2, 1, 'Digital Forensics', 'Decryption of Flash Drive Keystroke Logs', 'Forensic Lead Liza successfully extracted 14,000 decrypted keystrokes including administrator password hashes used during the exfiltration.', '2026-07-08 11:15:00', '2026-07-08 13:00:00', 3, 3, 1, 'Internal', 'Active', 1),
(3, 2, 'Raid & Seizure', 'Maritime Boarding Operation at Berth 9', 'Joint team of Coast Guard and Port Police boarded vessel MV Ocean Star. Discovered false bulkhead concealing 40-foot container #MSKU-998241.', '2026-07-10 16:00:00', '2026-07-10 18:45:00', 4, 4, 2, 'Internal', 'Active', 1),
(4, 3, 'Ballistics Analysis', 'Striation Match of Fired 9mm Shells', 'Ballistics lab confirmed casings fired at Dr. Rafiqul vehicle precisely match the 9mm Beretta recovered from suspect vehicle.', '2026-07-16 10:30:00', '2026-07-16 12:00:00', 3, 3, 1, 'Internal', 'Active', 1),
(5, 4, 'Surveillance', 'Undercover Sting Operation at Rajshahi Rail Crossing', 'Detective Sergeant Mahmud posing as currency wholesaler arrested courier Tanvir Ahmed with 2,500,000 BDT in counterfeit 1000 notes.', '2026-07-22 15:30:00', '2026-07-22 18:00:00', 6, 6, 4, 'Internal', 'Active', 1),
(6, 5, 'Network Analysis', 'C2 Server Attribution via Romanian Gateway', 'Cyber investigator Kamrul traced reverse SSH beacon to an offshore command and control server; shared IP indicator with CERT-BD.', '2026-07-27 16:00:00', '2026-07-27 17:30:00', 7, 7, 4, 'Internal', 'Active', 1);

-- ============================================================================
-- 18. AUDIT LOGS (Traceability & Security Verification)
-- ============================================================================
INSERT INTO audit_log (audit_id, request_id, user_id, event_type, entity_type, entity_id, action, route, http_method, ip_address, user_agent, branch_id, before_summary, after_summary, result, created_at) VALUES
(1, 'REQ-AUD-001', 1, 'AUTH_LOGIN', 'USER', '1', 'LOGIN', '/api/v1/auth/login', 'POST', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1, NULL, 'User admin_faisal logged in successfully as Chief Inspector', 'SUCCESS', '2026-07-01 08:00:00'),
(2, 'REQ-AUD-002', 1, 'RECORD_CREATE', 'COMPLAINT', '1', 'CONVERT_TO_FIR', '/api/v1/complaints/1/convert-fir', 'POST', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1, 'Status: Under Review', 'Status: Converted to FIR (FIR-2026-0101)', 'SUCCESS', '2026-07-01 08:30:00'),
(3, 'REQ-AUD-003', 4, 'RECORD_CREATE', 'CASE', '2', 'CASE_OPENED', '/api/v1/cases', 'POST', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 2, NULL, 'Opened Operation Kraken: Chittagong Contraband Syndicate', 'SUCCESS', '2026-07-09 14:00:00'),
(4, 'REQ-AUD-004', 3, 'RECORD_UPDATE', 'EVIDENCE', '1', 'STATUS_CHANGE', '/api/v1/evidence/1/status', 'POST', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 1, 'Status: Collected', 'Status: In Lab Analysis, Custodian: Liza', 'SUCCESS', '2026-07-05 09:30:00'),
(5, 'REQ-AUD-005', 1, 'RECORD_UPDATE', 'CASE', '4', 'CASE_CLOSED', '/api/v1/cases/4/close', 'POST', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 4, 'Status: Under Investigation', 'Status: Closed, Resolution: Complete conviction', 'SUCCESS', '2026-08-15 17:00:00');

-- ============================================================================
-- 19. SYSTEM SEQUENCES (Aligned with Fresh Production Seeds)
-- ============================================================================
INSERT INTO system_sequence (sequence_key, current_val, updated_at) VALUES
('CMP-2026', 808, NOW()),
('GD-DHK-2026', 95, NOW()),
('GD-CTG-2026', 46, NOW()),
('GD-RAJ-2026', 35, NOW()),
('GD-SYL-2026', 45, NOW()),
('FIR-2026', 106, NOW()),
('CAS-2026', 6, NOW());

-- End of Fresh Seed Data
