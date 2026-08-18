CREATE DATABASE ayshee_db;
USE ayshee_db;


CREATE TABLE `case` (
  `Case_ID` int(11) NOT NULL,
  `Case_Title` varchar(150) NOT NULL,
  `Status` varchar(30) DEFAULT 'Open',
  `Opened_Date` date DEFAULT NULL,
  `Assigned_Date` date DEFAULT NULL
) 


CREATE TABLE SUSPECT (
    Suspect_ID           INT AUTO_INCREMENT PRIMARY KEY,
    Name                 VARCHAR(100) NOT NULL,
    Age                  INT CHECK (Age >= 0),
    Identification_Sign  VARCHAR(255),
    Suspicion_Level      ENUM('Low','Medium','High') DEFAULT 'Low',
    Status                VARCHAR(50)
);


CREATE TABLE VICTIM (
    Victim_ID            INT AUTO_INCREMENT PRIMARY KEY,
    Name                 VARCHAR(100) NOT NULL,
    Age                  INT CHECK (Age >= 0),
    Identification_Sign  VARCHAR(255),
    Victim_Condition     VARCHAR(100),
    Is_Deceased          BOOLEAN DEFAULT FALSE
);



CREATE TABLE WITNESS (
    Witness_ID           INT AUTO_INCREMENT PRIMARY KEY,
    Name                 VARCHAR(100) NOT NULL,
    Age                  INT CHECK (Age >= 0),
    Identification_Sign  VARCHAR(255),
    Reliability_Note     VARCHAR(255),
    Is_Protected         BOOLEAN DEFAULT FALSE
);



CREATE TABLE `location` (
  `Location_ID` int(11) NOT NULL,
  `GPS` varchar(50) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `Area` varchar(100) DEFAULT NULL,
  `City` varchar(100) DEFAULT NULL
) 


CREATE TABLE EVIDENCE (
    Evidence_Number      INT AUTO_INCREMENT PRIMARY KEY,
    Title                VARCHAR(150) NOT NULL,
    Content              TEXT,
    Status               VARCHAR(50) DEFAULT 'Collected',
    Evidence_Type        VARCHAR(50),
    Collection_DateTime  DATETIME
);



CREATE TABLE EVIDENCE_STATUS_HISTORY (
    History_ID       INT AUTO_INCREMENT PRIMARY KEY,
    Evidence_Number  INT NOT NULL,
    Status           VARCHAR(50) NOT NULL,
    Changed_At       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Remarks          VARCHAR(255),
    FOREIGN KEY (Evidence_Number) REFERENCES EVIDENCE(Evidence_Number) ON DELETE CASCADE
);



CREATE TABLE CASE_SUSPECT (
    Case_ID     INT NOT NULL,
    Suspect_ID  INT NOT NULL,
    PRIMARY KEY (Case_ID, Suspect_ID),
    FOREIGN KEY (Case_ID) REFERENCES `CASE`(Case_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Suspect_ID) REFERENCES SUSPECT(Suspect_ID) ON DELETE CASCADE
);

CREATE TABLE CASE_VICTIM (
    Case_ID    INT NOT NULL,
    Victim_ID  INT NOT NULL,
    PRIMARY KEY (Case_ID, Victim_ID),
    FOREIGN KEY (Case_ID) REFERENCES `CASE`(Case_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Victim_ID) REFERENCES VICTIM(Victim_ID) ON DELETE CASCADE
);

CREATE TABLE CASE_WITNESS (
    Case_ID     INT NOT NULL,
    Witness_ID  INT NOT NULL,
    PRIMARY KEY (Case_ID, Witness_ID),
    FOREIGN KEY (Case_ID) REFERENCES `CASE`(Case_ID) ON DELETE RESTRICT,
    FOREIGN KEY (Witness_ID) REFERENCES WITNESS(Witness_ID) ON DELETE CASCADE
);

CREATE TABLE VICTIM_LOCATION (
    Victim_ID    INT NOT NULL,
    Location_ID  INT NOT NULL,
    PRIMARY KEY (Victim_ID, Location_ID),
    FOREIGN KEY (Victim_ID) REFERENCES VICTIM(Victim_ID) ON DELETE CASCADE,
    FOREIGN KEY (Location_ID) REFERENCES LOCATION(Location_ID) ON DELETE CASCADE
);

CREATE TABLE VICTIM_EVIDENCE (
    Victim_ID        INT NOT NULL,
    Evidence_Number  INT NOT NULL,
    PRIMARY KEY (Victim_ID, Evidence_Number),
    FOREIGN KEY (Victim_ID) REFERENCES VICTIM(Victim_ID) ON DELETE CASCADE,
    FOREIGN KEY (Evidence_Number) REFERENCES EVIDENCE(Evidence_Number) ON DELETE CASCADE
);



CREATE INDEX idx_suspect_name    ON SUSPECT(Name);
CREATE INDEX idx_victim_name     ON VICTIM(Name);
CREATE INDEX idx_witness_name    ON WITNESS(Name);
CREATE INDEX idx_evidence_status ON EVIDENCE_STATUS_HISTORY(Status);
