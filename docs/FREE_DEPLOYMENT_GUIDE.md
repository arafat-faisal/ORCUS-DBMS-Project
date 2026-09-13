# Free & Fast Deployment Guide for ORCUS (For Teacher Demonstration)

This guide covers the **fastest, completely 100% FREE** ways to deploy the ORCUS Police Investigation Management System online or share it directly from your laptop for evaluation.

---

## ⚡ Method 1: Instant 60-Second Live Public URL via Cloudflare Tunnel / Ngrok (Zero Cloud Setup)
*Best if you have everything working on your laptop and want to show the live system to your teacher from any device (laptop, tablet, phone, projector).*

### Option A: Cloudflare Tunnel (100% Free, No Account Required)
1. Download [cloudflared](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe) or install with winget:
   ```powershell
   winget install Cloudflare.cloudflared
   ```
2. Start the local ORCUS stack (`./start-dev.bat` or option 1).
3. In a new PowerShell window, run:
   ```powershell
   cloudflared tunnel --url http://localhost:7700
   ```
4. Cloudflare will output an instant public HTTPS URL like:
   ```
   https://random-words-123.trycloudflare.com
   ```
5. Anyone (including your teacher) can open that URL directly on their phone or laptop.

---

## 🌐 Method 2: Free 24/7 Cloud Hosting (Render + Vercel + TiDB/Aiven MySQL)

### Step 1: Free Cloud Database (MySQL 8.0)
Pick either of these 100% free cloud MySQL providers (no credit card needed):
- **TiDB Serverless** (5 GB Free Forever): [https://tidbcloud.com](https://tidbcloud.com)
  - Create a free cluster -> Click "Connect" -> Copy MySQL Connection String.
- **Aiven MySQL** (Free trial / Free credits): [https://aiven.io](https://aiven.io)

**Import Data into Cloud DB:**
Run your fresh seed SQL into your cloud database connection string:
```bash
mysql -h <host> -u <user> -p<password> --ssl-mode=REQUIRED <database> < database/fresh_seed.sql
```

---

### Step 2: Deploy Go Backend on Render.com (Free Tier)
1. Push your ORCUS repository to GitHub.
2. Sign up on [https://render.com](https://render.com) (free).
3. Click **New +** -> **Web Service** -> Connect your GitHub repo.
4. Set configurations:
   - **Root Directory**: `backend`
   - **Runtime**: `Go`
   - **Build Command**: `go build -o server ./cmd/server/main.go`
   - **Start Command**: `./server`
   - **Environment Variables**:
     - `PORT` = `5050`
     - `DB_USER` = `<cloud_mysql_user>`
     - `DB_PASS` = `<cloud_mysql_password>`
     - `DB_HOST` = `<cloud_mysql_host>`
     - `DB_PORT` = `4000` (or `3306`)
     - `DB_NAME` = `orcus_db`
     - `JWT_SECRET` = `OrcusProductionSecretKey_2026_Summer`
5. Click **Deploy**. Render will generate a free URL (e.g. `https://orcus-backend.onrender.com`).

---

### Step 3: Deploy Next.js Frontend on Vercel (Free Tier)
1. Sign up on [https://vercel.com](https://vercel.com) (free).
2. Click **Add New Project** -> Import your GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL` = `https://orcus-backend.onrender.com/api/v1`
4. Click **Deploy**. Vercel will deploy your Next.js application in under 2 minutes at:
   ```
   https://orcus-project.vercel.app
   ```

---

## 🎯 1-Click Auto-Login Credentials (Ready on UI)
On the login screen ([http://localhost:7700/login](http://localhost:7700/login)), we have pre-configured 1-click auto-login cards:
1. **Admin (Faisal)**: `admin_faisal` / `OrcusAdmin#2026` (Full Access, All Stations, Assign Branches)
2. **Lead Det. (Shakil)**: `det_shakil` / `OrcusShakil#2026` (Investigating Officer, Case Management)
3. **Duty Off. (Nusrat)**: `si_nusrat` / `OrcusNusrat#2026` (Intake & GD/FIR Conversion)
4. **Forensic (Liza)**: `forensic_liza` / `OrcusLiza#2026` (Chain of Custody & Vault)
5. **Inspector (Tariq)**: `insp_tariq` / `OrcusTariq#2026` (Port Zone Command)
6. **System Auditor**: `system_auditor` / `OrcusAudit#2026` (Read-only Audit Log Oversight)
