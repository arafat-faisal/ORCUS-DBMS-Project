-- ============================================================================
-- ORCUS - Organized Crime Understanding System (v2.0 Clean Schema)
-- Academic DBMS Investigation Management Prototype (Bangladesh Context)
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Normalized: Third Normal Form (3NF) with Audit & Custody Safeguards
-- ============================================================================

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `agency_branch` (
  `branch_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_name` varchar(100) NOT NULL,
  `name_bn` varchar(150) DEFAULT NULL,
  `branch_code` varchar(30) DEFAULT NULL,
  `branch_type` varchar(50) NOT NULL DEFAULT 'District Station',
  `district` varchar(100) NOT NULL,
  `division_id` int(10) unsigned DEFAULT NULL,
  `district_id` int(10) unsigned DEFAULT NULL,
  `thana_id` int(10) unsigned DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `uq_branch_name_district` (`branch_name`,`district`),
  UNIQUE KEY `uq_branch_code` (`branch_code`),
  KEY `idx_branch_district` (`district`),
  KEY `fk_branch_division` (`division_id`),
  KEY `fk_branch_district` (`district_id`),
  KEY `fk_branch_thana` (`thana_id`),
  CONSTRAINT `fk_branch_district` FOREIGN KEY (`district_id`) REFERENCES `geo_district` (`district_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_branch_division` FOREIGN KEY (`division_id`) REFERENCES `geo_division` (`division_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_branch_thana` FOREIGN KEY (`thana_id`) REFERENCES `geo_thana` (`thana_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_log` (
  `audit_id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `request_id` varchar(64) DEFAULT NULL,
  `user_id` int(10) unsigned DEFAULT NULL,
  `event_type` varchar(50) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `route` varchar(255) NOT NULL,
  `http_method` varchar(10) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `before_summary` text DEFAULT NULL,
  `after_summary` text DEFAULT NULL,
  `result` varchar(20) NOT NULL DEFAULT 'SUCCESS',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`audit_id`),
  KEY `idx_audit_user` (`user_id`),
  KEY `idx_audit_event_type` (`event_type`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_branch` (`branch_id`),
  KEY `idx_audit_created_at` (`created_at`),
  CONSTRAINT `fk_audit_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case` (
  `case_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `case_number` varchar(50) DEFAULT NULL,
  `case_title` varchar(200) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'Open',
  `priority` varchar(20) NOT NULL DEFAULT 'Medium',
  `opened_date` date NOT NULL,
  `assigned_date` date DEFAULT NULL,
  `review_deadline` date DEFAULT NULL,
  `closure_date` date DEFAULT NULL,
  `closure_reason` text DEFAULT NULL,
  `reopen_reason` text DEFAULT NULL,
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  `fir_id` int(10) unsigned DEFAULT NULL,
  `lead_officer_id` int(10) unsigned DEFAULT NULL,
  `lead_branch_id` int(10) unsigned DEFAULT NULL,
  `supervising_officer_id` int(10) unsigned DEFAULT NULL,
  `confidentiality_level` varchar(30) NOT NULL DEFAULT 'Standard',
  PRIMARY KEY (`case_id`),
  UNIQUE KEY `uq_case_number` (`case_number`),
  KEY `idx_case_status` (`status`),
  KEY `idx_case_opened_date` (`opened_date`),
  KEY `fk_case_fir` (`fir_id`),
  KEY `fk_case_lead_officer` (`lead_officer_id`),
  KEY `fk_case_lead_branch` (`lead_branch_id`),
  KEY `fk_case_supervisor` (`supervising_officer_id`),
  CONSTRAINT `fk_case_fir` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`fir_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_lead_branch` FOREIGN KEY (`lead_branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_lead_officer` FOREIGN KEY (`lead_officer_id`) REFERENCES `officer` (`officer_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_supervisor` FOREIGN KEY (`supervising_officer_id`) REFERENCES `officer` (`officer_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_case_status` CHECK (`status` in ('Open','Under Investigation','Pending Review','Closed','Reopened','Archived'))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_assignment_history` (
  `assignment_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `case_id` int(10) unsigned NOT NULL,
  `officer_id` int(10) unsigned NOT NULL,
  `assignment_role` varchar(50) NOT NULL DEFAULT 'Lead Investigator',
  `assigned_by_user_id` int(10) unsigned NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `effective_from` timestamp NOT NULL DEFAULT current_timestamp(),
  `effective_to` timestamp NULL DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  `handover_notes` text DEFAULT NULL,
  `transfer_reason` text DEFAULT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `idx_cah_case` (`case_id`),
  KEY `idx_cah_officer` (`officer_id`),
  KEY `idx_cah_status` (`status`),
  KEY `idx_cah_branch` (`branch_id`),
  KEY `fk_cah_user` (`assigned_by_user_id`),
  CONSTRAINT `fk_cah_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cah_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cah_officer` FOREIGN KEY (`officer_id`) REFERENCES `officer` (`officer_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cah_user` FOREIGN KEY (`assigned_by_user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_location` (
  `case_id` int(10) unsigned NOT NULL,
  `location_id` int(10) unsigned NOT NULL,
  `location_role` varchar(100) NOT NULL DEFAULT 'Crime Scene',
  PRIMARY KEY (`case_id`,`location_id`),
  KEY `fk_case_location_location` (`location_id`),
  CONSTRAINT `fk_case_location_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_location_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_status_history` (
  `history_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `case_id` int(10) unsigned NOT NULL,
  `status` varchar(30) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` text DEFAULT NULL,
  `changed_by_user_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `idx_case_history_status` (`status`),
  KEY `idx_case_history_changed_at` (`changed_at`),
  KEY `fk_case_history_case` (`case_id`),
  KEY `fk_case_history_user` (`changed_by_user_id`),
  CONSTRAINT `fk_case_history_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_suspect` (
  `case_id` int(10) unsigned NOT NULL,
  `suspect_id` int(10) unsigned NOT NULL,
  `role_in_crime` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`case_id`,`suspect_id`),
  KEY `fk_case_suspect_suspect` (`suspect_id`),
  CONSTRAINT `fk_case_suspect_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_suspect_suspect` FOREIGN KEY (`suspect_id`) REFERENCES `suspect` (`suspect_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_victim` (
  `case_id` int(10) unsigned NOT NULL,
  `victim_id` int(10) unsigned NOT NULL,
  `impact_type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`case_id`,`victim_id`),
  KEY `fk_case_victim_victim` (`victim_id`),
  CONSTRAINT `fk_case_victim_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_victim_victim` FOREIGN KEY (`victim_id`) REFERENCES `victim` (`victim_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `case_witness` (
  `case_id` int(10) unsigned NOT NULL,
  `witness_id` int(10) unsigned NOT NULL,
  `testimony_summary` text DEFAULT NULL,
  PRIMARY KEY (`case_id`,`witness_id`),
  KEY `fk_case_witness_witness` (`witness_id`),
  CONSTRAINT `fk_case_witness_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_case_witness_witness` FOREIGN KEY (`witness_id`) REFERENCES `witness` (`witness_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complainant` (
  `complainant_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`complainant_id`),
  KEY `idx_complainant_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complainant_contact` (
  `contact_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `complainant_id` int(10) unsigned NOT NULL,
  `contact_type` varchar(20) NOT NULL,
  `contact_value` varchar(100) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`contact_id`),
  KEY `fk_contact_complainant` (`complainant_id`),
  CONSTRAINT `fk_contact_complainant` FOREIGN KEY (`complainant_id`) REFERENCES `complainant` (`complainant_id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_contact_type` CHECK (`contact_type` in ('phone','email'))
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint` (
  `complaint_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `tracking_code` varchar(50) NOT NULL,
  `complainant_id` int(10) unsigned NOT NULL,
  `submission_channel` varchar(50) NOT NULL DEFAULT 'Officer Entry',
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `incident_date` date NOT NULL,
  `incident_time` time DEFAULT NULL,
  `approximate_time` tinyint(1) NOT NULL DEFAULT 0,
  `location_id` int(10) unsigned DEFAULT NULL,
  `complaint_category_id` int(10) unsigned DEFAULT NULL,
  `urgency` varchar(20) NOT NULL DEFAULT 'Medium',
  `receiving_branch_id` int(10) unsigned NOT NULL,
  `assigned_reviewer_id` int(10) unsigned DEFAULT NULL,
  `current_status` varchar(50) NOT NULL DEFAULT 'Submitted',
  `confidentiality_level` varchar(30) NOT NULL DEFAULT 'Standard',
  `public_status_message` varchar(500) DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_by_user_id` int(10) unsigned DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`complaint_id`),
  UNIQUE KEY `tracking_code` (`tracking_code`),
  KEY `idx_complaint_tracking` (`tracking_code`),
  KEY `idx_complaint_status` (`current_status`),
  KEY `idx_complaint_complainant` (`complainant_id`),
  KEY `idx_complaint_branch` (`receiving_branch_id`),
  KEY `idx_complaint_reviewer` (`assigned_reviewer_id`),
  KEY `idx_complaint_submitted` (`submitted_at`),
  KEY `fk_complaint_location` (`location_id`),
  KEY `fk_complaint_category` (`complaint_category_id`),
  KEY `fk_complaint_creator` (`created_by_user_id`),
  CONSTRAINT `fk_complaint_branch` FOREIGN KEY (`receiving_branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_category` FOREIGN KEY (`complaint_category_id`) REFERENCES `complaint_category` (`category_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_complainant` FOREIGN KEY (`complainant_id`) REFERENCES `complainant` (`complainant_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_complaint_reviewer` FOREIGN KEY (`assigned_reviewer_id`) REFERENCES `officer` (`officer_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_category` (
  `category_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name_en` varchar(100) NOT NULL,
  `name_bn` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `is_cognizable` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `name_en` (`name_en`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_status_history` (
  `history_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(10) unsigned NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) NOT NULL,
  `decision` varchar(100) NOT NULL,
  `reason` text DEFAULT NULL,
  `acting_user_id` int(10) unsigned DEFAULT NULL,
  `acting_branch_id` int(10) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`history_id`),
  KEY `idx_csh_complaint` (`complaint_id`),
  KEY `idx_csh_created` (`created_at`),
  KEY `fk_csh_user` (`acting_user_id`),
  KEY `fk_csh_branch` (`acting_branch_id`),
  CONSTRAINT `fk_csh_branch` FOREIGN KEY (`acting_branch_id`) REFERENCES `agency_branch` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_csh_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_csh_user` FOREIGN KEY (`acting_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `complaint_transfer_history` (
  `transfer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `complaint_id` int(10) unsigned NOT NULL,
  `from_branch_id` int(10) unsigned NOT NULL,
  `to_branch_id` int(10) unsigned NOT NULL,
  `transfer_reason` text NOT NULL,
  `transferred_by_user_id` int(10) unsigned NOT NULL,
  `transferred_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`transfer_id`),
  KEY `idx_cth_complaint` (`complaint_id`),
  KEY `idx_cth_transferred` (`transferred_at`),
  KEY `fk_cth_from_branch` (`from_branch_id`),
  KEY `fk_cth_to_branch` (`to_branch_id`),
  KEY `fk_cth_user` (`transferred_by_user_id`),
  CONSTRAINT `fk_cth_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cth_from_branch` FOREIGN KEY (`from_branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cth_to_branch` FOREIGN KEY (`to_branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_cth_user` FOREIGN KEY (`transferred_by_user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evidence` (
  `evidence_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `case_id` int(10) unsigned NOT NULL,
  `evidence_no` int(10) unsigned NOT NULL,
  `evidence_ref` varchar(64) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `packaging_ref` varchar(100) DEFAULT NULL,
  `seal_ref` varchar(100) DEFAULT NULL,
  `evidence_type` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Collected',
  `confidentiality_level` varchar(30) NOT NULL DEFAULT 'Standard',
  `collected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `collected_by_officer_id` int(10) unsigned DEFAULT NULL,
  `storage_location` varchar(150) DEFAULT NULL,
  `digital_hash` varchar(64) DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`evidence_id`),
  UNIQUE KEY `uq_case_evidence_no` (`case_id`,`evidence_no`),
  UNIQUE KEY `uq_evidence_ref` (`evidence_ref`),
  KEY `idx_evidence_status` (`status`),
  KEY `idx_evidence_type` (`evidence_type`),
  KEY `fk_evidence_officer` (`collected_by_officer_id`),
  CONSTRAINT `fk_evidence_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_evidence_officer` FOREIGN KEY (`collected_by_officer_id`) REFERENCES `officer` (`officer_id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_evidence_type` CHECK (`evidence_type` in ('Physical','Digital','Documentary','Biological','Forensic','Weapon','Narcotics','Other')),
  CONSTRAINT `chk_evidence_status` CHECK (`status` in ('Collected','In Lab Analysis','Stored in Vault','Presented in Court','Archived','Disposed'))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evidence_status_history` (
  `history_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `evidence_id` int(10) unsigned NOT NULL,
  `status` varchar(50) NOT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remarks` varchar(255) DEFAULT NULL,
  `changed_by_user_id` int(10) unsigned DEFAULT NULL,
  `action` varchar(50) NOT NULL DEFAULT 'Status Update',
  `from_custodian_id` int(10) unsigned DEFAULT NULL,
  `to_custodian_id` int(10) unsigned DEFAULT NULL,
  `from_location` varchar(150) DEFAULT NULL,
  `to_location` varchar(150) DEFAULT NULL,
  `seal_condition` varchar(30) NOT NULL DEFAULT 'Intact',
  `transfer_reason` text DEFAULT NULL,
  `request_ref` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `idx_evidence_history_status` (`status`),
  KEY `idx_evidence_history_changed_at` (`changed_at`),
  KEY `fk_evidence_history_user` (`changed_by_user_id`),
  KEY `fk_evidence_history_evidence` (`evidence_id`),
  KEY `fk_esh_from_custodian` (`from_custodian_id`),
  KEY `fk_esh_to_custodian` (`to_custodian_id`),
  CONSTRAINT `fk_esh_from_custodian` FOREIGN KEY (`from_custodian_id`) REFERENCES `officer` (`officer_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_esh_to_custodian` FOREIGN KEY (`to_custodian_id`) REFERENCES `officer` (`officer_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_evidence_history_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_evidence_history_user` FOREIGN KEY (`changed_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fir` (
  `fir_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `fir_number` varchar(50) NOT NULL,
  `crime_category` varchar(100) NOT NULL,
  `filed_date` date NOT NULL,
  `gd_id` int(10) unsigned DEFAULT NULL,
  `source_complaint_id` int(10) unsigned DEFAULT NULL,
  `source_type` varchar(50) NOT NULL DEFAULT 'Direct Complaint',
  PRIMARY KEY (`fir_id`),
  UNIQUE KEY `uq_fir_number` (`fir_number`),
  KEY `idx_fir_filed_date` (`filed_date`),
  KEY `idx_fir_crime_category` (`crime_category`),
  KEY `fk_fir_gd` (`gd_id`),
  KEY `fk_fir_complaint` (`source_complaint_id`),
  CONSTRAINT `fk_fir_complaint` FOREIGN KEY (`source_complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_fir_gd` FOREIGN KEY (`gd_id`) REFERENCES `gd` (`gd_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fir_legal_section` (
  `fir_id` int(10) unsigned NOT NULL,
  `section_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`fir_id`,`section_id`),
  KEY `fk_fir_legal_section_section` (`section_id`),
  CONSTRAINT `fk_fir_legal_section_fir` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`fir_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_fir_legal_section_section` FOREIGN KEY (`section_id`) REFERENCES `legal_section` (`section_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gd` (
  `gd_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gd_number` varchar(50) NOT NULL,
  `gd_date` date NOT NULL,
  `subject` text NOT NULL,
  `complainant_id` int(10) unsigned NOT NULL,
  `complaint_id` int(10) unsigned DEFAULT NULL,
  PRIMARY KEY (`gd_id`),
  UNIQUE KEY `uq_gd_number` (`gd_number`),
  KEY `idx_gd_date` (`gd_date`),
  KEY `fk_gd_complainant` (`complainant_id`),
  KEY `fk_gd_complaint` (`complaint_id`),
  CONSTRAINT `fk_gd_complainant` FOREIGN KEY (`complainant_id`) REFERENCES `complainant` (`complainant_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_gd_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaint` (`complaint_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geo_district` (
  `district_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `division_id` int(10) unsigned NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_bn` varchar(150) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`district_id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_district_division` (`division_id`),
  CONSTRAINT `fk_district_division` FOREIGN KEY (`division_id`) REFERENCES `geo_division` (`division_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geo_division` (
  `division_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name_en` varchar(100) NOT NULL,
  `name_bn` varchar(150) NOT NULL,
  `code` varchar(10) NOT NULL,
  PRIMARY KEY (`division_id`),
  UNIQUE KEY `name_en` (`name_en`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geo_thana` (
  `thana_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `district_id` int(10) unsigned NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_bn` varchar(150) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`thana_id`),
  KEY `idx_thana_district` (`district_id`),
  CONSTRAINT `fk_thana_district` FOREIGN KEY (`district_id`) REFERENCES `geo_district` (`district_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `geo_upazila` (
  `upazila_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `district_id` int(10) unsigned NOT NULL,
  `name_en` varchar(100) NOT NULL,
  `name_bn` varchar(150) NOT NULL,
  PRIMARY KEY (`upazila_id`),
  KEY `idx_upazila_district` (`district_id`),
  CONSTRAINT `fk_upazila_district` FOREIGN KEY (`district_id`) REFERENCES `geo_district` (`district_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `investigation_activity` (
  `activity_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `case_id` int(10) unsigned NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `occurred_at` datetime NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `recorded_by_user_id` int(10) unsigned NOT NULL,
  `officer_id` int(10) unsigned DEFAULT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `visibility` varchar(20) NOT NULL DEFAULT 'Internal',
  `attachment_ref` varchar(255) DEFAULT NULL,
  `correction_of_activity_id` int(10) unsigned DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  `version` int(10) unsigned NOT NULL DEFAULT 1,
  PRIMARY KEY (`activity_id`),
  KEY `idx_ia_case` (`case_id`),
  KEY `idx_ia_type` (`activity_type`),
  KEY `idx_ia_occurred` (`occurred_at`),
  KEY `idx_ia_recorded` (`recorded_at`),
  KEY `fk_ia_user` (`recorded_by_user_id`),
  KEY `fk_ia_officer` (`officer_id`),
  KEY `fk_ia_branch` (`branch_id`),
  KEY `fk_ia_correction` (`correction_of_activity_id`),
  CONSTRAINT `fk_ia_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ia_case` FOREIGN KEY (`case_id`) REFERENCES `case` (`case_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_ia_correction` FOREIGN KEY (`correction_of_activity_id`) REFERENCES `investigation_activity` (`activity_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ia_officer` FOREIGN KEY (`officer_id`) REFERENCES `officer` (`officer_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ia_user` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `legal_section` (
  `section_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `section_code` varchar(30) NOT NULL,
  `section_title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`section_id`),
  UNIQUE KEY `uq_legal_section_code` (`section_code`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `location` (
  `location_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `gps_coordinates` varchar(50) DEFAULT NULL,
  `address` varchar(255) NOT NULL,
  `area` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `division_id` int(10) unsigned DEFAULT NULL,
  `district_id` int(10) unsigned DEFAULT NULL,
  `upazila_id` int(10) unsigned DEFAULT NULL,
  `thana_id` int(10) unsigned DEFAULT NULL,
  `union_ward` varchar(100) DEFAULT NULL,
  `village_mahalla` varchar(150) DEFAULT NULL,
  `road` varchar(150) DEFAULT NULL,
  `house_holding` varchar(100) DEFAULT NULL,
  `landmark` varchar(200) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`location_id`),
  KEY `idx_location_city_area` (`city`,`area`),
  KEY `fk_location_division` (`division_id`),
  KEY `fk_location_district` (`district_id`),
  KEY `fk_location_upazila` (`upazila_id`),
  KEY `fk_location_thana` (`thana_id`),
  CONSTRAINT `fk_location_district` FOREIGN KEY (`district_id`) REFERENCES `geo_district` (`district_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_location_division` FOREIGN KEY (`division_id`) REFERENCES `geo_division` (`division_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_location_thana` FOREIGN KEY (`thana_id`) REFERENCES `geo_thana` (`thana_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_location_upazila` FOREIGN KEY (`upazila_id`) REFERENCES `geo_upazila` (`upazila_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `officer` (
  `officer_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `badge_no` varchar(20) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `rank` varchar(50) NOT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`officer_id`),
  UNIQUE KEY `uq_officer_badge` (`badge_no`),
  KEY `idx_officer_name` (`last_name`,`first_name`),
  KEY `fk_officer_branch` (`branch_id`),
  CONSTRAINT `fk_officer_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role` (
  `role_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `schema_migrations` (
  `version` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suspect` (
  `suspect_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `identification_sign` varchar(255) DEFAULT NULL,
  `suspicion_level` enum('Low','Medium','High') NOT NULL DEFAULT 'Low',
  `status` varchar(50) NOT NULL DEFAULT 'Under Investigation',
  PRIMARY KEY (`suspect_id`),
  KEY `idx_suspect_name` (`last_name`,`first_name`),
  KEY `idx_suspect_suspicion` (`suspicion_level`),
  CONSTRAINT `chk_suspect_age` CHECK (`age` is null or `age` >= 0 and `age` <= 120)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `system_sequence` (
  `sequence_key` varchar(64) NOT NULL,
  `current_val` bigint(20) unsigned NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`sequence_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `user_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `officer_id` int(10) unsigned DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `failed_login_attempts` int(11) NOT NULL DEFAULT 0,
  `locked_until` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_username` (`username`),
  UNIQUE KEY `uq_user_officer` (`officer_id`),
  CONSTRAINT `fk_user_officer` FOREIGN KEY (`officer_id`) REFERENCES `officer` (`officer_id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_user_username_len` CHECK (char_length(`username`) >= 3)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_role` (
  `user_id` int(10) unsigned NOT NULL,
  `role_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_user_role_role` (`role_id`),
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`role_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_case_overview` AS SELECT
 1 AS `case_id`,
  1 AS `case_title`,
  1 AS `case_status`,
  1 AS `opened_date`,
  1 AS `assigned_date`,
  1 AS `fir_number`,
  1 AS `crime_category`,
  1 AS `gd_number`,
  1 AS `lead_officer_badge`,
  1 AS `lead_officer_name`,
  1 AS `lead_officer_rank`,
  1 AS `branch_name`,
  1 AS `district`,
  1 AS `suspect_count`,
  1 AS `victim_count`,
  1 AS `witness_count`,
  1 AS `evidence_count` */;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_evidence_chain_of_custody` AS SELECT
 1 AS `evidence_id`,
  1 AS `case_id`,
  1 AS `case_title`,
  1 AS `evidence_no`,
  1 AS `evidence_title`,
  1 AS `evidence_type`,
  1 AS `storage_location`,
  1 AS `history_id`,
  1 AS `logged_status`,
  1 AS `changed_at`,
  1 AS `remarks`,
  1 AS `updated_by_username`,
  1 AS `updated_by_officer` */;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_fir_case_pipeline` AS SELECT
 1 AS `fir_id`,
  1 AS `fir_number`,
  1 AS `crime_category`,
  1 AS `filed_date`,
  1 AS `gd_number`,
  1 AS `gd_date`,
  1 AS `complainant_name`,
  1 AS `applicable_legal_sections`,
  1 AS `case_id`,
  1 AS `case_title`,
  1 AS `case_status` */;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_officer_caseload` AS SELECT
 1 AS `officer_id`,
  1 AS `badge_no`,
  1 AS `officer_name`,
  1 AS `rank`,
  1 AS `branch_name`,
  1 AS `district`,
  1 AS `total_cases_assigned`,
  1 AS `active_cases`,
  1 AS `closed_cases` */;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_suspect_dossier` AS SELECT
 1 AS `suspect_id`,
  1 AS `suspect_name`,
  1 AS `age`,
  1 AS `suspicion_level`,
  1 AS `suspect_status`,
  1 AS `identification_sign`,
  1 AS `case_id`,
  1 AS `case_title`,
  1 AS `case_status`,
  1 AS `role_in_crime` */;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `victim` (
  `victim_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `identification_sign` varchar(255) DEFAULT NULL,
  `condition_notes` varchar(255) DEFAULT NULL,
  `is_deceased` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`victim_id`),
  KEY `idx_victim_name` (`name`),
  CONSTRAINT `chk_victim_age` CHECK (`age` is null or `age` >= 0 and `age` <= 120)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `victim_evidence` (
  `victim_id` int(10) unsigned NOT NULL,
  `evidence_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`victim_id`,`evidence_id`),
  KEY `fk_victim_evidence_evidence` (`evidence_id`),
  CONSTRAINT `fk_victim_evidence_evidence` FOREIGN KEY (`evidence_id`) REFERENCES `evidence` (`evidence_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_victim_evidence_victim` FOREIGN KEY (`victim_id`) REFERENCES `victim` (`victim_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `victim_location` (
  `victim_id` int(10) unsigned NOT NULL,
  `location_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`victim_id`,`location_id`),
  KEY `fk_victim_location_location` (`location_id`),
  CONSTRAINT `fk_victim_location_location` FOREIGN KEY (`location_id`) REFERENCES `location` (`location_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_victim_location_victim` FOREIGN KEY (`victim_id`) REFERENCES `victim` (`victim_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `witness` (
  `witness_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `identification_sign` varchar(255) DEFAULT NULL,
  `reliability` varchar(50) NOT NULL DEFAULT 'Reliable',
  `is_protected` tinyint(1) NOT NULL DEFAULT 0,
  `statement_summary` text DEFAULT NULL,
  PRIMARY KEY (`witness_id`),
  KEY `idx_witness_name` (`name`),
  CONSTRAINT `chk_witness_age` CHECK (`age` is null or `age` >= 0 and `age` <= 120)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `v_case_overview`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_case_overview` AS select `c`.`case_id` AS `case_id`,`c`.`case_title` AS `case_title`,`c`.`status` AS `case_status`,`c`.`opened_date` AS `opened_date`,`c`.`assigned_date` AS `assigned_date`,`f`.`fir_number` AS `fir_number`,`f`.`crime_category` AS `crime_category`,`g`.`gd_number` AS `gd_number`,`o`.`badge_no` AS `lead_officer_badge`,concat(`o`.`first_name`,' ',`o`.`last_name`) AS `lead_officer_name`,`o`.`rank` AS `lead_officer_rank`,`b`.`branch_name` AS `branch_name`,`b`.`district` AS `district`,(select count(0) from `case_suspect` `cs` where `cs`.`case_id` = `c`.`case_id`) AS `suspect_count`,(select count(0) from `case_victim` `cv` where `cv`.`case_id` = `c`.`case_id`) AS `victim_count`,(select count(0) from `case_witness` `cw` where `cw`.`case_id` = `c`.`case_id`) AS `witness_count`,(select count(0) from `evidence` `e` where `e`.`case_id` = `c`.`case_id`) AS `evidence_count` from ((((`case` `c` left join `fir` `f` on(`c`.`fir_id` = `f`.`fir_id`)) left join `gd` `g` on(`f`.`gd_id` = `g`.`gd_id`)) left join `officer` `o` on(`c`.`lead_officer_id` = `o`.`officer_id`)) left join `agency_branch` `b` on(`o`.`branch_id` = `b`.`branch_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_evidence_chain_of_custody`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_evidence_chain_of_custody` AS select `e`.`evidence_id` AS `evidence_id`,`c`.`case_id` AS `case_id`,`c`.`case_title` AS `case_title`,`e`.`evidence_no` AS `evidence_no`,`e`.`title` AS `evidence_title`,`e`.`evidence_type` AS `evidence_type`,`e`.`storage_location` AS `storage_location`,`h`.`history_id` AS `history_id`,`h`.`status` AS `logged_status`,`h`.`changed_at` AS `changed_at`,`h`.`remarks` AS `remarks`,`u`.`username` AS `updated_by_username`,concat(`o`.`first_name`,' ',`o`.`last_name`) AS `updated_by_officer` from ((((`evidence` `e` join `case` `c` on(`e`.`case_id` = `c`.`case_id`)) join `evidence_status_history` `h` on(`e`.`evidence_id` = `h`.`evidence_id`)) left join `user` `u` on(`h`.`changed_by_user_id` = `u`.`user_id`)) left join `officer` `o` on(`u`.`officer_id` = `o`.`officer_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_fir_case_pipeline`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_fir_case_pipeline` AS select `f`.`fir_id` AS `fir_id`,`f`.`fir_number` AS `fir_number`,`f`.`crime_category` AS `crime_category`,`f`.`filed_date` AS `filed_date`,`g`.`gd_number` AS `gd_number`,`g`.`gd_date` AS `gd_date`,`cmp`.`name` AS `complainant_name`,group_concat(distinct `ls`.`section_code` order by `ls`.`section_code` ASC separator ', ') AS `applicable_legal_sections`,`c`.`case_id` AS `case_id`,`c`.`case_title` AS `case_title`,`c`.`status` AS `case_status` from (((((`fir` `f` left join `gd` `g` on(`f`.`gd_id` = `g`.`gd_id`)) left join `complainant` `cmp` on(`g`.`complainant_id` = `cmp`.`complainant_id`)) left join `fir_legal_section` `fls` on(`f`.`fir_id` = `fls`.`fir_id`)) left join `legal_section` `ls` on(`fls`.`section_id` = `ls`.`section_id`)) left join `case` `c` on(`f`.`fir_id` = `c`.`fir_id`)) group by `f`.`fir_id`,`f`.`fir_number`,`f`.`crime_category`,`f`.`filed_date`,`g`.`gd_number`,`g`.`gd_date`,`cmp`.`name`,`c`.`case_id`,`c`.`case_title`,`c`.`status` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_officer_caseload`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_officer_caseload` AS select `o`.`officer_id` AS `officer_id`,`o`.`badge_no` AS `badge_no`,concat(`o`.`first_name`,' ',`o`.`last_name`) AS `officer_name`,`o`.`rank` AS `rank`,`b`.`branch_name` AS `branch_name`,`b`.`district` AS `district`,count(`c`.`case_id`) AS `total_cases_assigned`,sum(case when `c`.`status` in ('Open','Under Investigation','Pending Review') then 1 else 0 end) AS `active_cases`,sum(case when `c`.`status` = 'Closed' then 1 else 0 end) AS `closed_cases` from ((`officer` `o` join `agency_branch` `b` on(`o`.`branch_id` = `b`.`branch_id`)) left join `case` `c` on(`o`.`officer_id` = `c`.`lead_officer_id`)) group by `o`.`officer_id`,`o`.`badge_no`,`o`.`first_name`,`o`.`last_name`,`o`.`rank`,`b`.`branch_name`,`b`.`district` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_suspect_dossier`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `v_suspect_dossier` AS select `s`.`suspect_id` AS `suspect_id`,concat(`s`.`first_name`,' ',`s`.`last_name`) AS `suspect_name`,`s`.`age` AS `age`,`s`.`suspicion_level` AS `suspicion_level`,`s`.`status` AS `suspect_status`,`s`.`identification_sign` AS `identification_sign`,`c`.`case_id` AS `case_id`,`c`.`case_title` AS `case_title`,`c`.`status` AS `case_status`,`cs`.`role_in_crime` AS `role_in_crime` from ((`suspect` `s` join `case_suspect` `cs` on(`s`.`suspect_id` = `cs`.`suspect_id`)) join `case` `c` on(`cs`.`case_id` = `c`.`case_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
