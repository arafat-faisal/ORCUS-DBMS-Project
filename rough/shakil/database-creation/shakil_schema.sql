-- ORCUS Database
-- Investigation Intake Module
-- Responsible Member: A.K. Md. Shakil Hossain

CREATE TABLE complainant (
complainant_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
name VARCHAR(100) NOT NULL,

```
CONSTRAINT pk_complainant
    PRIMARY KEY (complainant_id)
```

);

CREATE TABLE complainant_contact (
contact_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
complainant_id INT UNSIGNED NOT NULL,
contact_type VARCHAR(20) NOT NULL,
contact_value VARCHAR(100) NOT NULL,
is_primary BOOLEAN NOT NULL DEFAULT FALSE,

```
CONSTRAINT pk_complainant_contact
    PRIMARY KEY (contact_id),

CONSTRAINT fk_contact_complainant
    FOREIGN KEY (complainant_id)
    REFERENCES complainant (complainant_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

CONSTRAINT chk_contact_type
    CHECK (contact_type IN ('phone', 'email'))
```

);

CREATE TABLE gd (
gd_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
gd_number VARCHAR(50) NOT NULL,
gd_date DATE NOT NULL,
subject TEXT NOT NULL,
complainant_id INT UNSIGNED NOT NULL,

```
CONSTRAINT pk_gd
    PRIMARY KEY (gd_id),

CONSTRAINT uq_gd_number
    UNIQUE (gd_number),

CONSTRAINT fk_gd_complainant
    FOREIGN KEY (complainant_id)
    REFERENCES complainant (complainant_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
```

);

CREATE TABLE fir (
fir_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
fir_number VARCHAR(50) NOT NULL,
crime_category VARCHAR(100) NOT NULL,
filed_date DATE NOT NULL,
gd_id INT UNSIGNED NULL,

```
CONSTRAINT pk_fir
    PRIMARY KEY (fir_id),

CONSTRAINT uq_fir_number
    UNIQUE (fir_number),

CONSTRAINT fk_fir_gd
    FOREIGN KEY (gd_id)
    REFERENCES gd (gd_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
```

);

CREATE TABLE legal_section (
section_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
section_code VARCHAR(30) NOT NULL,
section_title VARCHAR(150) NOT NULL,
description TEXT NULL,

```
CONSTRAINT pk_legal_section
    PRIMARY KEY (section_id),

CONSTRAINT uq_legal_section_code
    UNIQUE (section_code)
```

);

CREATE TABLE fir_legal_section (
fir_id INT UNSIGNED NOT NULL,
section_id INT UNSIGNED NOT NULL,

```
CONSTRAINT pk_fir_legal_section
    PRIMARY KEY (fir_id, section_id),

CONSTRAINT fk_fir_legal_section_fir
    FOREIGN KEY (fir_id)
    REFERENCES fir (fir_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

CONSTRAINT fk_fir_legal_section_section
    FOREIGN KEY (section_id)
    REFERENCES legal_section (section_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
```

);

CREATE TABLE `case` (
case_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
case_title VARCHAR(200) NOT NULL,
status VARCHAR(30) NOT NULL,
opened_date DATE NOT NULL,
assigned_date DATE NULL,
fir_id INT UNSIGNED NULL,

```
CONSTRAINT pk_case
    PRIMARY KEY (case_id),

CONSTRAINT fk_case_fir
    FOREIGN KEY (fir_id)
    REFERENCES fir (fir_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
```

);

CREATE TABLE case_status_history (
history_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
case_id INT UNSIGNED NOT NULL,
status VARCHAR(30) NOT NULL,
changed_at DATETIME NOT NULL,
remarks TEXT NULL,

```
CONSTRAINT pk_case_status_history
    PRIMARY KEY (history_id),

CONSTRAINT fk_case_status_history_case
    FOREIGN KEY (case_id)
    REFERENCES `case` (case_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
```

);

CREATE INDEX idx_complainant_name
ON complainant (name);

CREATE INDEX idx_gd_date
ON gd (gd_date);

CREATE INDEX idx_fir_filed_date
ON fir (filed_date);

CREATE INDEX idx_fir_crime_category
ON fir (crime_category);

CREATE INDEX idx_case_status
ON `case` (status);

CREATE INDEX idx_case_opened_date
ON `case` (opened_date);

CREATE INDEX idx_case_status_history_case
ON case_status_history (case_id);

CREATE INDEX idx_case_status_history_changed_at
ON case_status_history (changed_at);
