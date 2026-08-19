# API Specification — Organization & Access Control Module

**Module Owner:** Md. Arafat Hossain Faisal (241400060)  
**Assigned Database Tables:** `agency_branch`, `officer`, `user`, `role`, `user_role`  
**Target Framework:** Go (Gin + sqlx + MySQL + JWT + bcrypt)

---

## 1. Authentication & User Endpoints

### 1.1 User Login
- **Method:** `POST`
- **Path:** `/api/v1/auth/login`
- **Access:** Public
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "admin_faisal",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "user_id": 1,
        "username": "admin_faisal",
        "officer_id": 1,
        "officer_name": "Arafat Faisal",
        "badge_no": "ORC-1001",
        "rank": "Chief Inspector",
        "branch_id": 1,
        "branch_name": "Central Headquarters",
        "district": "Dhaka",
        "roles": ["Administrator", "Lead Investigator"]
      }
    }
  }
  ```
- **Error Response (401 Unauthorized):**
  ```json
  {
    "success": false,
    "error": "Invalid username or password"
  }
  ```

---

### 1.2 Get Current Authenticated Profile
- **Method:** `GET`
- **Path:** `/api/v1/auth/me`
- **Access:** Authenticated (Any Valid User)
- **Request Headers:** `Authorization: Bearer <jwt-token>`
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "user_id": 1,
      "username": "admin_faisal",
      "officer_id": 1,
      "officer_name": "Arafat Faisal",
      "badge_no": "ORC-1001",
      "rank": "Chief Inspector",
      "branch_id": 1,
      "branch_name": "Central Headquarters",
      "district": "Dhaka",
      "roles": ["Administrator", "Lead Investigator"]
    }
  }
  ```

---

### 1.3 Register New User Account
- **Method:** `POST`
- **Path:** `/api/v1/auth/register`
- **Access:** Role: `Administrator`
- **Request Headers:** `Authorization: Bearer <jwt-token>`, `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "username": "investigator_rahim",
    "password": "SecretPassword@123",
    "officer_id": 2,
    "role_ids": [2, 3]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "User account created successfully",
    "data": {
      "user_id": 10,
      "username": "investigator_rahim",
      "officer_id": 2,
      "roles": ["Lead Investigator", "Field Detective"]
    }
  }
  ```

---

## 2. Agency Branch Endpoints

### 2.1 List Branches
- **Method:** `GET`
- **Path:** `/api/v1/branches`
- **Access:** Authenticated
- **Query Parameters:**
  - `district` (string, optional): Filter by district name (e.g. `?district=Dhaka`)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      {
        "branch_id": 1,
        "branch_name": "Central Headquarters",
        "district": "Dhaka"
      },
      {
        "branch_id": 2,
        "branch_name": "Port Zone Regional Office",
        "district": "Chittagong"
      }
    ]
  }
  ```

---

### 2.2 Get Branch by ID
- **Method:** `GET`
- **Path:** `/api/v1/branches/:id`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "branch_id": 1,
      "branch_name": "Central Headquarters",
      "district": "Dhaka"
    }
  }
  ```

---

### 2.3 Create New Branch
- **Method:** `POST`
- **Path:** `/api/v1/branches`
- **Access:** Role: `Administrator`
- **Request Body:**
  ```json
  {
    "branch_name": "Northern Metro Station",
    "district": "Gazipur"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Branch created successfully",
    "data": {
      "branch_id": 6,
      "branch_name": "Northern Metro Station",
      "district": "Gazipur"
    }
  }
  ```

---

## 3. Officer Endpoints

### 3.1 List Officers with Search & Filter
- **Method:** `GET`
- **Path:** `/api/v1/officers`
- **Access:** Authenticated
- **Query Parameters:**
  - `search` (string, optional): Search by officer name or badge number
  - `branch_id` (integer, optional): Filter by assigned branch ID
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "officer_id": 1,
        "badge_no": "ORC-1001",
        "first_name": "Arafat",
        "last_name": "Faisal",
        "rank": "Chief Inspector",
        "branch_id": 1,
        "branch_name": "Central Headquarters",
        "district": "Dhaka"
      }
    ]
  }
  ```

---

### 3.2 Get Officer Details
- **Method:** `GET`
- **Path:** `/api/v1/officers/:id`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "officer_id": 1,
      "badge_no": "ORC-1001",
      "first_name": "Arafat",
      "last_name": "Faisal",
      "rank": "Chief Inspector",
      "branch_id": 1,
      "branch_name": "Central Headquarters",
      "district": "Dhaka"
    }
  }
  ```

---

### 3.3 Create Sworn Officer
- **Method:** `POST`
- **Path:** `/api/v1/officers`
- **Access:** Role: `Administrator`
- **Request Body:**
  ```json
  {
    "badge_no": "ORC-1009",
    "first_name": "Zubair",
    "last_name": "Hasan",
    "rank": "Detective Sub-Inspector",
    "branch_id": 1
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Officer registered successfully",
    "data": {
      "officer_id": 9,
      "badge_no": "ORC-1009",
      "first_name": "Zubair",
      "last_name": "Hasan",
      "rank": "Detective Sub-Inspector",
      "branch_id": 1
    }
  }
  ```

---

### 3.4 Get Officer Caseload Report
- **Method:** `GET`
- **Path:** `/api/v1/officers/caseload`
- **Access:** Authenticated
- **Response (200 OK):** (Directly queries SQL View `v_officer_caseload`)
  ```json
  {
    "success": true,
    "count": 8,
    "data": [
      {
        "officer_id": 1,
        "badge_no": "ORC-1001",
        "officer_name": "Arafat Faisal",
        "rank": "Chief Inspector",
        "branch_name": "Central Headquarters",
        "district": "Dhaka",
        "total_cases_assigned": 1,
        "active_cases": 1,
        "closed_cases": 0
      }
    ]
  }
  ```

---

## 4. Role Endpoints

### 4.1 List All Roles
- **Method:** `GET`
- **Path:** `/api/v1/roles`
- **Access:** Authenticated
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": [
      { "role_id": 1, "role_name": "Administrator", "description": "Full system access and user role provisioning" },
      { "role_id": 2, "role_name": "Lead Investigator", "description": "Authorized to open, assign, and close investigation cases" },
      { "role_id": 3, "role_name": "Field Detective", "description": "Authorized to log evidence, suspects, and witness statements" },
      { "role_id": 4, "role_name": "Forensic Specialist", "description": "Authorized to manage evidence analysis and status tracking" },
      { "role_id": 5, "role_name": "System Auditor", "description": "Read-only audit access across all investigation records" }
    ]
  }
  ```
