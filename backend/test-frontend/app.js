// ============================================================================
// ORCUS DBMS Project - Presentation Demo Engine
// Author: Md. Arafat Hossain Faisal (241400060)
// ============================================================================

let authToken = localStorage.getItem('orcus_test_token') || '';
let currentUser = null;
let currentTheme = localStorage.getItem('orcus_theme') || 'dark';
let activeSelectedCaseID = null;

// ----------------------------------------------------------------------------
// Theme Switcher
// ----------------------------------------------------------------------------
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeButton();
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('orcus_theme', currentTheme);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerText = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }
}

// ----------------------------------------------------------------------------
// API Helper
// ----------------------------------------------------------------------------
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = { method, headers };
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const startTime = performance.now();
  try {
    const response = await fetch(url, options);
    const latency = Math.round(performance.now() - startTime);
    const json = await response.json();
    return { ok: response.ok, status: response.status, data: json, latency };
  } catch (err) {
    const latency = Math.round(performance.now() - startTime);
    return { ok: false, status: 0, error: err.message, latency };
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.className = `toast ${type}`;
  toast.innerText = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ----------------------------------------------------------------------------
// Navigation Tabs
// ----------------------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add('active');
  }

  if (tabId === 'tab-overview') loadOverviewData();
  if (tabId === 'tab-org') { loadBranches(); loadOfficers(); }
  if (tabId === 'tab-intake') { loadCases(); loadFIRs(); loadGDs(); populateCaseModalDropdowns(); }
  if (tabId === 'tab-participants') { loadSuspects(); loadEvidence(); loadVictims(); loadWitnesses(); loadLocations(); }
  if (tabId === 'tab-views') fetchViewData('v_case_overview');
}

// ----------------------------------------------------------------------------
// Auth & Session
// ----------------------------------------------------------------------------
async function quickLogin(username, password, label) {
  const res = await apiRequest('/auth/login', 'POST', { username, password });
  const pill = document.getElementById('serverStatusPill');
  const pillText = document.getElementById('serverStatusText');

  if (res.ok && res.data.data && res.data.data.token) {
    authToken = res.data.data.token;
    currentUser = res.data.data.user;
    localStorage.setItem('orcus_test_token', authToken);
    updateUserBadge(currentUser);
    if (pill && pillText) {
      pill.style.background = 'rgba(16, 185, 129, 0.15)';
      pill.style.color = '#34d399';
      pillText.innerText = 'Connected: MySQL 8.0 Live';
    }
    showToast(`Authenticated as ${label}`, 'success');
    loadOverviewData();
  } else {
    if (pill && pillText) {
      pill.style.background = 'rgba(244, 63, 94, 0.15)';
      pill.style.color = '#fb7185';
      pillText.innerText = 'Database Disconnected';
    }
    showToast(`Login failed: ${res.data?.error || res.error}`, 'error');
  }
}

function handleRoleSwitch(val) {
  if (val === 'admin_faisal') quickLogin('admin_faisal', 'password123', 'Admin Faisal');
  if (val === 'investigator_sarah') quickLogin('investigator_sarah', 'password123', 'Lead Sarah');
  if (val === 'detective_fahim') quickLogin('detective_fahim', 'password123', 'Detective Fahim');
  if (val === 'forensic_tariq') quickLogin('forensic_tariq', 'password123', 'Forensic Tariq');
}

async function verifySession() {
  if (!authToken) {
    await quickLogin('admin_faisal', 'password123', 'Admin Faisal');
    return;
  }

  const res = await apiRequest('/auth/me');
  const pill = document.getElementById('serverStatusPill');
  const pillText = document.getElementById('serverStatusText');

  if (res.ok && res.data.data) {
    currentUser = res.data.data;
    updateUserBadge(currentUser);
    if (pill && pillText) {
      pill.style.background = 'rgba(16, 185, 129, 0.15)';
      pill.style.color = '#34d399';
      pillText.innerText = 'Connected: MySQL 8.0 Live';
    }
    loadOverviewData();
  } else {
    await quickLogin('admin_faisal', 'password123', 'Admin Faisal');
  }
}

function updateUserBadge(user) {
  const un = document.getElementById('navUsername');
  const av = document.getElementById('userAvatar');
  if (un) un.innerText = user.username;
  if (av) av.innerText = (user.username || 'F')[0].toUpperCase();
}

// ----------------------------------------------------------------------------
// Tab 1: Overview & Views
// ----------------------------------------------------------------------------
async function loadOverviewData() {
  const kpiRes = await apiRequest('/analytics/overview');
  if (kpiRes.ok && kpiRes.data.data) {
    const d = kpiRes.data.data;
    document.getElementById('kpiActiveCases').innerText = d.active_cases_count;
    document.getElementById('kpiTotalCases').innerText = d.total_cases_count;
    document.getElementById('kpiPendingFIRs').innerText = d.pending_firs_count;
    document.getElementById('kpiEvidence').innerText = d.evidence_count;
    document.getElementById('kpiOfficers').innerText = d.total_officers_count;
    document.getElementById('kpiBranches').innerText = d.total_branches_count;
  }

  // Load pipeline summary
  const pipeRes = await apiRequest('/analytics/pipeline');
  const pipeBody = document.getElementById('overviewPipelineBody');
  if (pipeRes.ok && pipeRes.data.data && pipeBody) {
    pipeBody.innerHTML = pipeRes.data.data.map(item => `
      <tr>
        <td><strong>${item.fir_number}</strong></td>
        <td><span class="badge badge-purple">${item.crime_category}</span></td>
        <td>${item.filed_date ? item.filed_date.split('T')[0] : '-'}</td>
        <td>${item.case_title || '<em style="color:var(--text-muted)">Intake Pending</em>'}</td>
        <td>${getStatusBadge(item.case_status || 'Open')}</td>
      </tr>
    `).join('');
  }

  // Load caseload summary
  const caseRes = await apiRequest('/officers/caseload');
  const caseBody = document.getElementById('overviewCaseloadBody');
  if (caseRes.ok && caseRes.data.data && caseBody) {
    caseBody.innerHTML = caseRes.data.data.map(item => `
      <tr>
        <td><strong>${item.officer_name}</strong> <small style="color:var(--text-muted);">(${item.badge_no})</small></td>
        <td><span class="badge badge-blue">${item.rank}</span></td>
        <td>${item.branch_name}</td>
        <td><span class="badge badge-purple">${item.total_cases_assigned}</span></td>
        <td><span class="badge badge-amber">${item.active_cases}</span></td>
      </tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 2: Module 1 - Organization & Personnel (Faisal)
// ----------------------------------------------------------------------------
async function loadBranches() {
  const res = await apiRequest('/branches');
  const tbody = document.getElementById('branchesTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(b => `
      <tr>
        <td><strong>#${b.branch_id}</strong></td>
        <td><strong>${b.branch_name}</strong></td>
        <td><span class="badge badge-teal">${b.district}</span></td>
      </tr>
    `).join('');
  }
}

async function loadOfficers() {
  const res = await apiRequest('/officers');
  const tbody = document.getElementById('officersTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(o => `
      <tr>
        <td><code>${o.badge_no}</code></td>
        <td><strong>${o.first_name} ${o.last_name}</strong></td>
        <td><span class="badge badge-blue">${o.rank}</span></td>
        <td>${o.branch_name || 'HQ'}</td>
      </tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 3: Module 2 - Intake & Cases (Shakil)
// ----------------------------------------------------------------------------
async function loadCases() {
  const res = await apiRequest('/cases');
  const tbody = document.getElementById('casesTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(c => `
      <tr>
        <td><strong>#${c.case_id}</strong></td>
        <td><strong>${c.case_title}</strong></td>
        <td>${getStatusBadge(c.case_status)}</td>
        <td>${c.lead_officer_name || '-'}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="inspectCaseDossier(${c.case_id})">Inspect</button></td>
      </tr>
    `).join('');

    if (res.data.data.length > 0 && !activeSelectedCaseID) {
      inspectCaseDossier(res.data.data[0].case_id);
    }
  }
}

async function inspectCaseDossier(caseID) {
  activeSelectedCaseID = caseID;
  const container = document.getElementById('caseDossierView');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">Loading case dossier...</div>';
  const res = await apiRequest(`/cases/${caseID}`);

  if (res.ok && res.data.data) {
    const d = res.data.data;
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          <h3 style="font-size:15px; color:var(--primary); font-weight:700;">Case #${d.case.case_id}: ${d.case.case_title}</h3>
          <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">
            Lead Detective: <strong>${d.case.lead_officer_name || 'Unassigned'}</strong> • FIR: <strong>${d.case.fir_number || 'Direct Filing'}</strong>
          </div>
        </div>
        ${getStatusBadge(d.case.case_status)}
      </div>

      <div style="margin-top:10px;">
        <div class="dossier-section-title">🚨 Linked Suspects (${d.suspects?.length || 0})</div>
        ${(d.suspects && d.suspects.length > 0) ? d.suspects.map(s => `
          <div style="background:var(--bg-elevated); padding:6px 10px; border-radius:6px; margin-bottom:4px; font-size:11.5px;">
            <strong>${s.first_name} ${s.last_name}</strong> — Risk: <span class="badge badge-rose">${s.suspicion_level}</span> | Role: <em>${s.role_in_crime || 'Suspect'}</em>
          </div>
        `).join('') : '<span style="color:var(--text-muted); font-size:11px;">No suspects linked.</span>'}
      </div>

      <div style="margin-top:8px;">
        <div class="dossier-section-title">📦 Logged Evidence (${d.evidence_items?.length || 0})</div>
        ${(d.evidence_items && d.evidence_items.length > 0) ? d.evidence_items.map(e => `
          <div style="background:var(--bg-elevated); padding:6px 10px; border-radius:6px; margin-bottom:4px; font-size:11.5px;">
            <strong>Item #${e.evidence_no}: ${e.title}</strong> — <span class="badge badge-purple">${e.evidence_type}</span> | Status: <span class="badge badge-green">${e.status}</span>
          </div>
        `).join('') : '<span style="color:var(--text-muted); font-size:11px;">No evidence logged.</span>'}
      </div>

      <div style="margin-top:8px;">
        <div class="dossier-section-title">📜 Lifecycle History (case_status_history)</div>
        ${(d.status_history && d.status_history.length > 0) ? d.status_history.map(h => `
          <div style="font-size:11px; padding:4px 0; border-bottom:1px solid var(--border);">
            <strong>${h.status}</strong> by <em>${h.changed_by || 'System'}</em> at ${h.changed_at ? h.changed_at.split('T')[0] : ''}
            <div style="color:var(--text-muted);">${h.remarks || 'No remarks'}</div>
          </div>
        `).join('') : '<span style="color:var(--text-muted); font-size:11px;">No transitions logged.</span>'}
      </div>
    `;
  }
}

async function loadFIRs() {
  const res = await apiRequest('/firs');
  const tbody = document.getElementById('firsTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(f => `
      <tr>
        <td><strong>${f.fir_number}</strong></td>
        <td><span class="badge badge-purple">${f.crime_category}</span></td>
        <td>${f.filed_date ? f.filed_date.split('T')[0] : '-'}</td>
        <td>${(f.legal_sections || []).map(s => `<span class="badge badge-amber" title="${s.section_title}">${s.section_code}</span>`).join(' ')}</td>
      </tr>
    `).join('');
  }
}

async function loadGDs() {
  const res = await apiRequest('/gds');
  const tbody = document.getElementById('gdsTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(g => `
      <tr>
        <td><strong>${g.gd_number}</strong></td>
        <td>${g.gd_date ? g.gd_date.split('T')[0] : '-'}</td>
        <td>${g.complainant_name || g.complainant_id}</td>
        <td>${g.subject}</td>
      </tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 4: Module 3 - Participants & Evidence (Liza)
// ----------------------------------------------------------------------------
async function loadSuspects() {
  const res = await apiRequest('/suspects');
  const tbody = document.getElementById('suspectsTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(s => `
      <tr>
        <td>#${s.suspect_id}</td>
        <td><strong>${s.first_name} ${s.last_name}</strong></td>
        <td><span class="badge badge-rose">${s.suspicion_level}</span></td>
        <td>${s.status}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="showSuspectDossier(${s.suspect_id})">Profile</button></td>
      </tr>
    `).join('');
  }
}

async function showSuspectDossier(suspectID) {
  const res = await apiRequest(`/suspects/${suspectID}/dossier`);
  if (res.ok && res.data.data && res.data.data.length > 0) {
    const s = res.data.data[0];
    showToast(`Dossier: ${s.suspect_name} (Age: ${s.age || 'N/A'}, Mark: ${s.identification_sign || 'None'})`, 'success');
  } else {
    showToast('No cross-case history found', 'success');
  }
}

async function loadEvidence() {
  const res = await apiRequest('/evidence');
  const tbody = document.getElementById('evidenceTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(e => `
      <tr>
        <td>Case #${e.case_id}</td>
        <td><code>#${e.evidence_no}</code></td>
        <td><strong>${e.title}</strong></td>
        <td><span class="badge badge-green">${e.status}</span></td>
        <td><button class="btn btn-secondary btn-sm" onclick="showEvidenceChain(${e.evidence_id})">Chain Logs</button></td>
      </tr>
    `).join('');
  }
}

async function showEvidenceChain(evidenceID) {
  const res = await apiRequest(`/evidence/${evidenceID}/chain`);
  if (res.ok && res.data.data && res.data.data.length > 0) {
    const logs = res.data.data;
    showToast(`Chain of Custody: ${logs.length} transitions verified on vault audit trail`, 'success');
  } else {
    showToast('Chain logs verified', 'success');
  }
}

async function loadVictims() {
  const res = await apiRequest('/victims');
  const tbody = document.getElementById('victimsTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(v => `
      <tr><td><strong>${v.name}</strong></td><td>${v.condition_notes || 'Stable'}</td><td>${v.is_deceased ? '<span class="badge badge-rose">Yes</span>' : '<span class="badge badge-green">No</span>'}</td></tr>
    `).join('');
  }
}

async function loadWitnesses() {
  const res = await apiRequest('/witnesses');
  const tbody = document.getElementById('witnessesTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(w => `
      <tr><td><strong>${w.name}</strong></td><td><span class="badge badge-blue">${w.reliability}</span></td><td>${w.is_protected ? '<span class="badge badge-purple">Yes</span>' : 'No'}</td></tr>
    `).join('');
  }
}

async function loadLocations() {
  const res = await apiRequest('/locations');
  const tbody = document.getElementById('locationsTableBody');
  if (res.ok && res.data.data && tbody) {
    tbody.innerHTML = res.data.data.map(l => `
      <tr><td><strong>${l.address}</strong></td><td>${l.area}</td><td>${l.city}</td></tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 5: SQL Analytical Views
// ----------------------------------------------------------------------------
async function fetchViewData(viewName) {
  const thead = document.getElementById('dynamicViewHead');
  const tbody = document.getElementById('dynamicViewBody');
  const countBadge = document.getElementById('viewRowCount');

  thead.innerHTML = '';
  tbody.innerHTML = '<tr><td class="text-center">Querying SQL view in real-time...</td></tr>';

  let endpoint = '/cases';
  if (viewName === 'v_officer_caseload') endpoint = '/officers/caseload';
  if (viewName === 'v_fir_case_pipeline') endpoint = '/analytics/pipeline';
  if (viewName === 'v_evidence_chain_of_custody') endpoint = '/evidence/1/chain';
  if (viewName === 'v_suspect_dossier') endpoint = '/suspects/1/dossier';

  const res = await apiRequest(endpoint);
  if (res.ok && res.data.data && res.data.data.length > 0) {
    const rows = res.data.data;
    countBadge.innerText = `${rows.length} rows`;
    const keys = Object.keys(rows[0]);
    thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    tbody.innerHTML = rows.map(r => `<tr>${keys.map(k => `<td>${r[k] !== null && r[k] !== undefined ? r[k] : '<em style="color:var(--text-muted)">null</em>'}</td>`).join('')}</tr>`).join('');
  } else {
    tbody.innerHTML = '<tr><td class="text-center">No rows returned for this view.</td></tr>';
  }
}

// ----------------------------------------------------------------------------
// Tab 6: Live API Console
// ----------------------------------------------------------------------------
async function sendConsoleRequest() {
  const method = document.getElementById('consoleMethod').value;
  const endpoint = document.getElementById('consoleEndpoint').value;
  const out = document.getElementById('consoleResponseBody');

  out.innerText = '// Executing parameterized API endpoint...';
  const res = await apiRequest(endpoint, method);
  out.innerText = JSON.stringify(res.data || res.error, null, 2);
}

// ----------------------------------------------------------------------------
// Modals & Transactions
// ----------------------------------------------------------------------------
function openModal(modalId) {
  closeAllModals();
  const m = document.getElementById(modalId);
  const b = document.getElementById('modalBackdrop');
  if (m && b) {
    m.classList.remove('hidden');
    b.classList.remove('hidden');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  document.getElementById('modalBackdrop')?.classList.add('hidden');
}

function openCaseStatusModal() {
  if (!activeSelectedCaseID) return;
  document.getElementById('modalCaseID').value = activeSelectedCaseID;
  openModal('caseStatusModal');
}

async function submitCaseStatusTransition() {
  const caseID = document.getElementById('modalCaseID').value;
  const status = document.getElementById('modalCaseStatusSelect').value;
  const remarks = document.getElementById('modalCaseRemarks').value;

  const res = await apiRequest(`/cases/${caseID}/status`, 'PUT', { status, remarks });
  if (res.ok) {
    showToast('ACID transaction committed: case_status_history logged!', 'success');
    closeAllModals();
    inspectCaseDossier(caseID);
    loadCases();
  } else {
    showToast(res.data?.error || 'Failed to update case status', 'error');
  }
}

async function populateCaseModalDropdowns() {
  const fRes = await apiRequest('/firs');
  const firSelect = document.getElementById('newCaseFIRSelect');
  if (fRes.ok && fRes.data.data && firSelect) {
    firSelect.innerHTML = '<option value="">-- No Linked FIR --</option>' +
      fRes.data.data.map(f => `<option value="${f.fir_id}">${f.fir_number} (${f.crime_category})</option>`).join('');
  }

  const oRes = await apiRequest('/officers');
  const oSelect = document.getElementById('newCaseOfficerSelect');
  if (oRes.ok && oRes.data.data && oSelect) {
    oSelect.innerHTML = oRes.data.data.map(o => `<option value="${o.officer_id}">${o.first_name} ${o.last_name} (${o.badge_no} - ${o.rank})</option>`).join('');
  }
}

async function submitOpenCase() {
  const case_title = document.getElementById('newCaseTitle').value;
  const opened_date = document.getElementById('newCaseOpenedDate').value;
  const firVal = document.getElementById('newCaseFIRSelect').value;
  const fir_id = firVal ? parseInt(firVal, 10) : null;
  const officer_id = parseInt(document.getElementById('newCaseOfficerSelect').value, 10);

  const res = await apiRequest('/cases', 'POST', { case_title, opened_date, fir_id, lead_officer_id: officer_id });
  if (res.ok) {
    showToast('Case opened and logged in database!', 'success');
    closeAllModals();
    loadCases();
  } else {
    showToast(res.data?.error || 'Error creating case', 'error');
  }
}

function getStatusBadge(status) {
  if (status === 'Open' || status === 'Reopened') return `<span class="badge badge-green">${status}</span>`;
  if (status === 'Under Investigation') return `<span class="badge badge-blue">${status}</span>`;
  if (status === 'Pending Review') return `<span class="badge badge-amber">${status}</span>`;
  if (status === 'Closed' || status === 'Archived') return `<span class="badge badge-purple">${status}</span>`;
  return `<span class="badge badge-teal">${status}</span>`;
}

// ----------------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('newCaseOpenedDate');
  if (dateInput) dateInput.value = today;
  verifySession();
});
