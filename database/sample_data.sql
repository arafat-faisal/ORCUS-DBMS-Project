-- ============================================================================
-- ORCUS Investigation Agency - Sample Dataset
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- Database     : orcus_db
-- Description  : Realistic comprehensive sample data for demonstration,
--                testing relationships, constraints, views, and queries.
-- ============================================================================

USE orcus_db;

-- ----------------------------------------------------------------------------
-- 1. AGENCY_BRANCH
-- ----------------------------------------------------------------------------
INSERT INTO agency_branch (branch_id, branch_name, district) VALUES
(1, 'Central Headquarters', 'Dhaka'),
(2, 'Port Zone Regional Office', 'Chittagong'),
(3, 'Northeast Division Station', 'Sylhet'),
(4, 'Northern Regional Branch', 'Rajshahi'),
(5, 'Southwest Maritime Wing', 'Khulna');

-- ----------------------------------------------------------------------------
-- 2. OFFICER
-- ----------------------------------------------------------------------------
INSERT INTO officer (officer_id, badge_no, first_name, last_name, rank, branch_id) VALUES
(1, 'ORC-1001', 'Arafat', 'Faisal', 'Chief Inspector', 1),
(2, 'ORC-1002', 'Shakil', 'Hossain', 'Senior Detective', 1),
(3, 'ORC-1003', 'Ayshee', 'Liza', 'Forensic Lead Specialist', 1),
(4, 'ORC-2001', 'Tariq', 'Ahmed', 'Inspector', 2),
(5, 'ORC-2002', 'Nusrat', 'Jahan', 'Sub-Inspector', 2),
(6, 'ORC-3001', 'Mahmudur', 'Rahman', 'Detective Sergeant', 3),
(7, 'ORC-4001', 'Kamrul', 'Hasan', 'Cybercrime Investigator', 4),
(8, 'ORC-5001', 'Farhana', 'Kabir', 'Field Intelligence Officer', 5);

-- ----------------------------------------------------------------------------
-- 3. USER
-- ----------------------------------------------------------------------------
-- Passwords are stored as bcrypt hashes of example passwords
INSERT INTO `user` (user_id, username, password_hash, officer_id) VALUES
(1, 'admin_faisal', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 1),
(2, 'det_shakil',    '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 2),
(3, 'forensic_liza', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 3),
(4, 'insp_tariq',    '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 4),
(5, 'si_nusrat',     '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 5),
(6, 'det_mahmud',    '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 6),
(7, 'cyber_kamrul',  '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 7),
(8, 'intel_farhana', '$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', 8),
(9, 'system_auditor','$2y$10$abcdefghijklmnopqrstuv1234567890abcdefghijklmnopqrstuv', NULL);

-- ----------------------------------------------------------------------------
-- 4. ROLE
-- ----------------------------------------------------------------------------
INSERT INTO role (role_id, role_name, description) VALUES
(1, 'Administrator', 'Full system access and user role provisioning'),
(2, 'Lead Investigator', 'Authorized to open, assign, and close investigation cases'),
(3, 'Field Detective', 'Authorized to log evidence, suspects, and witness statements'),
(4, 'Forensic Specialist', 'Authorized to manage evidence analysis and status tracking'),
(5, 'System Auditor', 'Read-only audit access across all investigation records');

-- ----------------------------------------------------------------------------
-- 5. USER_ROLE
-- ----------------------------------------------------------------------------
INSERT INTO user_role (user_id, role_id) VALUES
(1, 1), -- Faisal : Administrator
(1, 2), -- Faisal : Lead Investigator
(2, 2), -- Shakil : Lead Investigator
(2, 3), -- Shakil : Field Detective
(3, 4), -- Liza   : Forensic Specialist
(4, 2), -- Tariq  : Lead Investigator
(5, 3), -- Nusrat : Field Detective
(6, 3), -- Mahmud : Field Detective
(7, 3), -- Kamrul : Field Detective
(7, 4), -- Kamrul : Forensic Specialist
(8, 3), -- Farhana: Field Detective
(9, 5); -- Auditor: System Auditor

-- ----------------------------------------------------------------------------
-- 6. COMPLAINANT
-- ----------------------------------------------------------------------------
INSERT INTO complainant (complainant_id, name) VALUES
(1, 'Dr. Rafiqul Islam'),
(2, 'Shahidul Alam Chowdhury'),
(3, 'Tasnim Begum'),
(4, 'Kazi Enterprise Ltd (Rep: Anisur Rahman)'),
(5, 'Nasreen Akter');

-- ----------------------------------------------------------------------------
-- 7. COMPLAINANT_CONTACT
-- ----------------------------------------------------------------------------
INSERT INTO complainant_contact (contact_id, complainant_id, contact_type, contact_value, is_primary) VALUES
(1, 1, 'phone', '+8801711000111', TRUE),
(2, 1, 'email', 'dr.rafiqul@gmail.com', FALSE),
(3, 2, 'phone', '+8801819222333', TRUE),
(4, 3, 'phone', '+8801912444555', TRUE),
(5, 3, 'email', 'tasnim.begum@yahoo.com', FALSE),
(6, 4, 'phone', '+8801615666777', TRUE),
(7, 4, 'email', 'security@kazienterprise.com', FALSE),
(8, 5, 'phone', '+8801518888999', TRUE);

-- ----------------------------------------------------------------------------
-- 8. GD (General Diary)
-- ----------------------------------------------------------------------------
INSERT INTO gd (gd_id, gd_number, gd_date, subject, complainant_id) VALUES
(1, 'GD-DHK-2026-0012', '2026-07-01', 'Report of suspicious offshore wire transfer attempts from corporate bank accounts.', 4),
(2, 'GD-CTG-2026-0045', '2026-07-05', 'Unidentified container tampering observed at Chattogram Port Terminal 3.', 2),
(3, 'GD-DHK-2026-0089', '2026-07-10', 'Extortion phone calls with ransom demand from an anonymous VOIP number.', 1),
(4, 'GD-SYL-2026-0023', '2026-07-15', 'Illegal cross-border consignment movement reported along border check-post.', 3),
(5, 'GD-RAJ-2026-0034', '2026-07-20', 'Ransomware malware detected on regional power distribution server.', 5);

-- ----------------------------------------------------------------------------
-- 9. FIR (First Information Report)
-- ----------------------------------------------------------------------------
INSERT INTO fir (fir_id, fir_number, crime_category, filed_date, gd_id) VALUES
(1, 'FIR-2026-0101', 'Financial Cyber Fraud', '2026-07-03', 1),
(2, 'FIR-2026-0102', 'Organized Maritime Smuggling', '2026-07-08', 2),
(3, 'FIR-2026-0103', 'Armed Extortion & Kidnapping Threat', '2026-07-12', 3),
(4, 'FIR-2026-0104', 'Counterfeit Currency Syndicate', '2026-07-18', NULL), -- Direct FIR
(5, 'FIR-2026-0105', 'Critical Infrastructure Cyber Attack', '2026-07-22', 5);

-- ----------------------------------------------------------------------------
-- 10. LEGAL_SECTION
-- ----------------------------------------------------------------------------
INSERT INTO legal_section (section_id, section_code, section_title, description) VALUES
(1, 'BPC-420', 'Cheating and Dishonestly Inducing Delivery of Property', 'Penal Code section covering fraud and deception.'),
(2, 'BPC-384', 'Punishment for Extortion', 'Penal Code section covering extortion by threatening injury or death.'),
(3, 'BPC-395', 'Punishment for Dacoity', 'Penal Code section covering organized armed gang robbery.'),
(4, 'BPC-120B', 'Criminal Conspiracy', 'Penal Code section covering conspiracy to commit offenses.'),
(5, 'CSA-17', 'Illegal Access to Critical Information Infrastructure', 'Cyber Security Act section on cyber sabotage.'),
(6, 'CA-156', 'Smuggling under Customs Act', 'Customs Act section covering prohibited contraband import.');

-- ----------------------------------------------------------------------------
-- 11. FIR_LEGAL_SECTION
-- ----------------------------------------------------------------------------
INSERT INTO fir_legal_section (fir_id, section_id) VALUES
(1, 1), -- FIR-0101: BPC-420
(1, 4), -- FIR-0101: BPC-120B
(1, 5), -- FIR-0101: CSA-17
(2, 4), -- FIR-0102: BPC-120B
(2, 6), -- FIR-0102: CA-156
(3, 2), -- FIR-0103: BPC-384
(3, 4), -- FIR-0103: BPC-120B
(4, 1), -- FIR-0104: BPC-420
(4, 3), -- FIR-0104: BPC-395
(5, 5); -- FIR-0105: CSA-17

-- ----------------------------------------------------------------------------
-- 12. CASE
-- ----------------------------------------------------------------------------
INSERT INTO `case` (case_id, case_title, status, opened_date, assigned_date, fir_id, lead_officer_id) VALUES
(1, 'Operation Shadow Wire: Corporate Fund Exfiltration', 'Under Investigation', '2026-07-04', '2026-07-04', 1, 1),
(2, 'Operation Kraken: Chittagong Contraband Syndicate', 'Under Investigation', '2026-07-09', '2026-07-10', 2, 4),
(3, 'Operation Iron Shield: Gulshan Extortion Ring', 'Pending Review', '2026-07-13', '2026-07-14', 3, 2),
(4, 'Operation Silver Mint: Fake Currency Distribution', 'Closed', '2026-07-19', '2026-07-20', 4, 6),
(5, 'Operation Black Grid: Grid Control Malware Intrusion', 'Open', '2026-07-23', '2026-07-24', 5, 7);

-- ----------------------------------------------------------------------------
-- 13. CASE_STATUS_HISTORY
-- ----------------------------------------------------------------------------
INSERT INTO case_status_history (history_id, case_id, status, changed_at, remarks, changed_by_user_id) VALUES
(1, 1, 'Open', '2026-07-04 09:00:00', 'Case opened following FIR-2026-0101 registration.', 1),
(2, 1, 'Under Investigation', '2026-07-04 11:30:00', 'Lead investigator assigned and evidence gathering initiated.', 1),
(3, 2, 'Open', '2026-07-09 14:00:00', 'Maritime customs violation case registered.', 4),
(4, 2, 'Under Investigation', '2026-07-10 10:00:00', 'Port premises inspected with container seizure.', 4),
(5, 3, 'Open', '2026-07-13 16:00:00', 'High-priority extortion case opened.', 2),
(6, 3, 'Under Investigation', '2026-07-14 09:30:00', 'Call records and audio intercept files analyzed.', 2),
(7, 3, 'Pending Review', '2026-08-01 15:00:00', 'Investigation complete, final dossier submitted to prosecutor.', 2),
(8, 4, 'Open', '2026-07-19 08:00:00', 'Counterfeit currency network raid initiated.', 6),
(9, 4, 'Under Investigation', '2026-07-20 12:00:00', 'Counterfeit plates and printing machinery seized.', 6),
(10, 4, 'Closed', '2026-08-10 17:00:00', 'All syndicate members convicted; case resolved.', 1),
(11, 5, 'Open', '2026-07-23 11:00:00', 'Incident response team deployed to regional grid substation.', 7);

-- ----------------------------------------------------------------------------
-- 14. SUSPECT
-- ----------------------------------------------------------------------------
INSERT INTO suspect (suspect_id, first_name, last_name, age, date_of_birth, identification_sign, suspicion_level, status) VALUES
(1, 'Jubayer', 'Khan', 34, '1992-04-12', 'Scar across left eyebrow', 'High', 'Under Investigation'),
(2, 'Monirul', 'Islam', 42, '1984-08-25', 'Dragon tattoo on right forearm', 'High', 'Arrested'),
(3, 'Shahriar', 'Haque', 29, '1997-02-18', 'Mole under right eye', 'Medium', 'Under Surveillance'),
(4, 'Delwar', 'Hossain', 51, '1975-11-03', 'Limp in left leg', 'High', 'Arrested'),
(5, 'Tanvir', 'Ahmed', 26, '2000-06-30', 'None recorded', 'Low', 'Interrogated');

-- ----------------------------------------------------------------------------
-- 15. VICTIM
-- ----------------------------------------------------------------------------
INSERT INTO victim (victim_id, name, phone, age, identification_sign, condition_notes, is_deceased) VALUES
(1, 'Kazi Enterprise Ltd Stakeholders', '+8801615666777', NULL, 'Corporate entity', 'Financial loss exceeding 45M BDT', FALSE),
(2, 'Dr. Rafiqul Islam', '+8801711000111', 58, 'Grey hair, glasses', 'Severe psychological distress and security threat', FALSE),
(3, 'Zabir Ahmed', '+8801811999000', 32, 'Burn mark on wrist', 'Sustained physical assault during warehouse heist', FALSE),
(4, 'Northern Power Grid Consumer Network', NULL, NULL, 'Public infrastructure', 'Power outage affecting 150K households', FALSE);

-- ----------------------------------------------------------------------------
-- 16. WITNESS
-- ----------------------------------------------------------------------------
INSERT INTO witness (witness_id, name, phone, age, identification_sign, reliability, is_protected, statement_summary) VALUES
(1, 'Moinul Ahsan', '+8801722334455', 45, 'Wearing security uniform', 'High', TRUE, 'Eyewitness who spotted the suspect vehicle entering the loading bay at 02:30 AM.'),
(2, 'Sabrina Noor', '+8801933445566', 31, 'None', 'High', FALSE, 'Bank branch operations officer who identified fraudulent Swift routing headers.'),
(3, 'Abdul Karim', '+8801544556677', 62, 'White beard', 'Moderate', FALSE, 'Tea stall owner outside warehouse who heard loud arguments before gunshots.'),
(4, 'Rasel Mia', '+8801855667788', 27, 'None', 'High', TRUE, 'Inside informant providing encrypted chat logs of the extortion syndicate.');

-- ----------------------------------------------------------------------------
-- 17. LOCATION
-- ----------------------------------------------------------------------------
INSERT INTO location (location_id, gps_coordinates, address, area, city) VALUES
(1, '23.7937° N, 90.4066° E', 'House 42, Road 11, Block D', 'Banani', 'Dhaka'),
(2, '22.3168° N, 91.8021° E', 'Container Yard Gate 4, Port Area', 'Agrabad', 'Chittagong'),
(3, '23.7925° N, 90.4167° E', 'Gulshan Avenue Commercial Complex', 'Gulshan-2', 'Dhaka'),
(4, '24.3636° N, 88.6241° E', 'Substation 4, Power Grid Colony', 'Motihar', 'Rajshahi'),
(5, '24.8949° N, 91.8687° E', 'Tamabil Highway Border Checkpoint', 'Jaflong', 'Sylhet');

-- ----------------------------------------------------------------------------
-- 18. EVIDENCE (Weak Entity under CASE)
-- ----------------------------------------------------------------------------
INSERT INTO evidence (evidence_id, case_id, evidence_no, title, description, evidence_type, status, collected_at, collected_by_officer_id, storage_location) VALUES
(1, 1, 1, 'Encrypted USB Flash Drive', 'SanDisk 128GB drive containing malicious banking scripts and keystroke loggers.', 'Digital', 'In Lab Analysis', '2026-07-04 14:00:00', 1, 'Digital Forensics Lab - Locker D1'),
(2, 1, 2, 'Forged Corporate Authorization Letter', 'Counterfeit letterhead with simulated signatures for fund release.', 'Documentary', 'Stored in Vault', '2026-07-05 10:30:00', 2, 'Evidence Vault A - Shelf 3'),
(3, 2, 1, 'Seized Smuggling Container #MSKU-9982', 'Forty-foot shipping container containing concealed undeclared electronics.', 'Physical', 'Stored in Vault', '2026-07-10 16:45:00', 4, 'Port Seizure Holding Bay 2'),
(4, 2, 2, 'Satellite Phone (Iridium 9555)', 'Used by syndicate leader to coordinate vessel docking off-grid.', 'Digital', 'In Lab Analysis', '2026-07-11 11:20:00', 4, 'Digital Forensics Lab - Locker D2'),
(5, 3, 1, 'Recorded Extortion Voicemail Audio', 'Audio file capturing voice threats and ransom demand of 20M BDT.', 'Digital', 'Presented in Court', '2026-07-14 11:00:00', 2, 'Court Exhibit Evidence Safe'),
(6, 3, 2, '9mm Beretta Pistol w/ Magazine', 'Recovered from suspect vehicle during Gulshan interception.', 'Weapon', 'Stored in Vault', '2026-07-15 03:30:00', 2, 'Ballistics Vault - Locker W4'),
(7, 4, 1, 'Intaglio Printing Plates', 'Master plates used to counterfeit 1000 BDT currency notes.', 'Physical', 'Archived', '2026-07-20 18:00:00', 6, 'National Archives Evidence Unit'),
(8, 5, 1, 'Hard Drive Image - SCADA Server', 'Forensic bitstream raw copy of corrupted power grid control unit.', 'Forensic', 'In Lab Analysis', '2026-07-24 13:15:00', 7, 'Cyber Defense Sandbox VM-09');

-- ----------------------------------------------------------------------------
-- 19. EVIDENCE_STATUS_HISTORY
-- ----------------------------------------------------------------------------
INSERT INTO evidence_status_history (history_id, evidence_id, status, changed_at, remarks, changed_by_user_id) VALUES
(1, 1, 'Collected', '2026-07-04 14:00:00', 'Seized from suspect workstation at Banani office.', 1),
(2, 1, 'In Lab Analysis', '2026-07-05 09:30:00', 'Transferred to Liza for firmware hash extraction.', 3),
(3, 2, 'Collected', '2026-07-05 10:30:00', 'Recovered from bank compliance file.', 2),
(4, 2, 'Stored in Vault', '2026-07-05 16:00:00', 'Placed in high-security document repository.', 3),
(5, 3, 'Collected', '2026-07-10 16:45:00', 'Impounded at Chattogram port berth.', 4),
(6, 3, 'Stored in Vault', '2026-07-11 08:00:00', 'Customs seal applied and placed under guard.', 4),
(7, 5, 'Collected', '2026-07-14 11:00:00', 'Extracted from victim mobile device.', 2),
(8, 5, 'In Lab Analysis', '2026-07-16 10:00:00', 'Acoustic voice biometric profile matched with suspect.', 3),
(9, 5, 'Presented in Court', '2026-07-30 14:30:00', 'Admitted as primary prosecution exhibit in Metropolitan Court.', 1),
(10, 6, 'Collected', '2026-07-15 03:30:00', 'Recovered during armed apprehending maneuver.', 2),
(11, 6, 'Stored in Vault', '2026-07-15 11:00:00', 'Ballistic testing completed; stored in weapon safe.', 3),
(12, 7, 'Collected', '2026-07-20 18:00:00', 'Seized from clandestine printing press.', 6),
(13, 7, 'Archived', '2026-08-11 10:00:00', 'Case closed; item archived per judicial decree.', 1);

-- ----------------------------------------------------------------------------
-- 20. CASE_SUSPECT
-- ----------------------------------------------------------------------------
INSERT INTO case_suspect (case_id, suspect_id, role_in_crime) VALUES
(1, 1, 'Principal Hacker / Fund Router'),
(1, 3, 'Account Mule / Recipient'),
(2, 2, 'Syndicate Logistics Coordinator'),
(2, 4, 'Financier and Customs Insider'),
(3, 1, 'VoIP Caller and Extortionist'),
(3, 4, 'Arms Supplier'),
(4, 4, 'Master Counterfeiter'),
(4, 5, 'Distribution Courier'),
(5, 1, 'Remote Exploitation Operator');

-- ----------------------------------------------------------------------------
-- 21. CASE_VICTIM
-- ----------------------------------------------------------------------------
INSERT INTO case_victim (case_id, victim_id, impact_type) VALUES
(1, 1, 'Direct Financial Victim'),
(3, 2, 'Primary Extortion Target'),
(2, 3, 'Direct Physical Assault Victim'),
(5, 4, 'Critical Infrastructure Service Disruption');

-- ----------------------------------------------------------------------------
-- 22. CASE_WITNESS
-- ----------------------------------------------------------------------------
INSERT INTO case_witness (case_id, witness_id, testimony_summary) VALUES
(1, 2, 'Verified unauthorized login times matched suspect ISP logs.'),
(2, 1, 'Saw contraband unloading into unmarked freight trucks.'),
(3, 4, 'Supplied key decryption passphrase for syndicate chat server.'),
(4, 3, 'Identified suspect warehouse location in Rajshahi.'),
(5, 2, 'Detected anomalous network latency spikes before blackout.');

-- ----------------------------------------------------------------------------
-- 23. CASE_LOCATION
-- ----------------------------------------------------------------------------
INSERT INTO case_location (case_id, location_id, location_role) VALUES
(1, 1, 'Primary Incident Crime Scene'),
(2, 2, 'Seizure & Incident Location'),
(3, 3, 'Extortion Drop Point'),
(4, 5, 'Smuggling Interception Point'),
(5, 4, 'Sabotage Site');

-- ----------------------------------------------------------------------------
-- 24. VICTIM_LOCATION
-- ----------------------------------------------------------------------------
INSERT INTO victim_location (victim_id, location_id) VALUES
(1, 1),
(2, 3),
(3, 2),
(4, 4);

-- ----------------------------------------------------------------------------
-- 25. VICTIM_EVIDENCE
-- ----------------------------------------------------------------------------
INSERT INTO victim_evidence (victim_id, evidence_id) VALUES
(1, 1),
(1, 2),
(2, 5),
(3, 3),
(4, 8);
