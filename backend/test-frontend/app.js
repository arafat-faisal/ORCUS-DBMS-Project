// ============================================================================
// ORCUS Interactive Test & Diagnostic Dashboard JS
// Author: Md. Arafat Hossain Faisal (241400060)
// ============================================================================

let authToken = localStorage.getItem('orcus_test_token') || '';
let currentUser = null;

function getBaseUrl() {
  const input = document.getElementById('apiBaseUrl');
  if (input && input.value && input.value.trim() !== '') {
    return input.value.trim().replace(/\/+$/, '');
  }
  if (window.location.origin && window.location.origin.startsWith('http')) {
    return `${window.location.origin}/api/v1`;
  }
  return 'http://localhost:5050/api/v1';
}

// ----------------------------------------------------------------------------
// API Helper
// ----------------------------------------------------------------------------
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${getBaseUrl()}${endpoint}`;
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

// ----------------------------------------------------------------------------
// Notification Toast
// ----------------------------------------------------------------------------
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.className = `toast ${type}`;
  toast.innerText = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ----------------------------------------------------------------------------
// Tab Navigation
// ----------------------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const targetPane = document.getElementById(tabId);
  const targetNav = document.querySelector(`[data-tab="${tabId}"]`);

  if (targetPane) targetPane.classList.add('active');
  if (targetNav) targetNav.classList.add('active');

  // Trigger data loaders
  if (tabId === 'tab-overview') loadOverviewData();
  if (tabId === 'tab-org') { loadBranches(); loadOfficers(); }
  if (tabId === 'tab-intake') { loadComplainants(); loadGDs(); loadFIRs(); loadLegalSections(); }
  if (tabId === 'tab-cases') { loadCases(); populateCaseModalDropdowns(); }
  if (tabId === 'tab-participants') { loadSuspects(); loadVictims(); loadWitnesses(); loadLocations(); }
  if (tabId === 'tab-evidence') { loadEvidence(); populateEvidenceModalDropdowns(); }
  if (tabId === 'tab-views') loadViewData('v_case_overview');
}

function switchSubtab(subtabId) {
  document.querySelectorAll('.subtab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.subtab-btn').forEach(el => el.classList.remove('active'));

  const target = document.getElementById(subtabId);
  if (target) target.classList.add('active');
  if (typeof window !== 'undefined' && window.event && window.event.target) {
    window.event.target.classList.add('active');
  }
}

// ----------------------------------------------------------------------------
// Authentication & Quick Switcher
// ----------------------------------------------------------------------------
async function quickLogin(username, password, label) {
  document.querySelectorAll('.quick-login-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText.toLowerCase().includes(username.split('_')[0].toLowerCase())) {
      btn.classList.add('active');
    }
  });

  const res = await apiRequest('/auth/login', 'POST', { username, password });
  if (res.ok && res.data.data && res.data.data.token) {
    authToken = res.data.data.token;
    currentUser = res.data.data.user;
    localStorage.setItem('orcus_test_token', authToken);
    updateUserBadge(currentUser);
    showToast(`Logged in as ${label}`, 'success');
    loadOverviewData();
  } else {
    showToast(`Login failed: ${res.data?.error || res.error}`, 'error');
  }
}

async function verifySession() {
  if (!authToken) {
    quickLogin('admin_faisal', 'password123', 'Admin Faisal');
    return;
  }

  const res = await apiRequest('/auth/me');
  const pill = document.getElementById('serverStatusPill');
  const pillText = document.getElementById('serverStatusText');

  if (res.ok && res.data.data) {
    currentUser = res.data.data;
    updateUserBadge(currentUser);
    pill.style.background = 'rgba(16, 185, 129, 0.15)';
    pill.style.color = '#34d399';
    pillText.innerText = 'Connected: MySQL 8.0 (Live)';
    loadOverviewData();
  } else {
    pill.style.background = 'rgba(244, 63, 94, 0.15)';
    pill.style.color = '#fb7185';
    pillText.innerText = 'Session Expired / Reconnecting...';
    quickLogin('admin_faisal', 'password123', 'Admin Faisal');
  }
}

function updateUserBadge(user) {
  document.getElementById('navUsername').innerText = user.username;
  document.getElementById('navUserRole').innerText = user.roles?.join(', ') || 'Authorized';
  document.getElementById('userAvatar').innerText = user.username[0].toUpperCase();
}

// ----------------------------------------------------------------------------
// Tab 1: Overview & KPIs
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
  const tbody = document.getElementById('pipelineTableBody');
  if (pipeRes.ok && pipeRes.data.data) {
    const items = pipeRes.data.data.slice(0, 8);
    tbody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.fir_number}</strong></td>
        <td><span class="badge badge-purple">${item.crime_category}</span></td>
        <td>${item.filed_date ? item.filed_date.split('T')[0] : '-'}</td>
        <td>${item.complainant_name || 'Anonymous'}</td>
        <td>${item.case_title || '<em style="color:#94a3b8">Pending Case Open</em>'}</td>
        <td>${getStatusBadge(item.case_status || 'Intake')}</td>
      </tr>
    `).join('');
  }

  // Load caseload summary
  const caseRes = await apiRequest('/officers/caseload');
  const cBody = document.getElementById('caseloadSummaryTableBody');
  if (caseRes.ok && caseRes.data.data) {
    const items = caseRes.data.data.slice(0, 6);
    cBody.innerHTML = items.map(item => `
      <tr>
        <td><strong>${item.officer_name}</strong> <small style="color:#64748b">(${item.badge_no})</small></td>
        <td>${item.rank}</td>
        <td>${item.branch_name}</td>
        <td><span class="badge badge-blue">${item.total_cases_assigned}</span></td>
        <td><span class="badge badge-amber">${item.active_cases}</span></td>
      </tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 2: Branches & Officers
// ----------------------------------------------------------------------------
async function loadBranches() {
  const res = await apiRequest('/branches');
  const tbody = document.getElementById('branchesTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(b => `
      <tr>
        <td>${b.branch_id}</td>
        <td><strong>${b.branch_name}</strong></td>
        <td><span class="badge badge-teal">${b.district}</span></td>
      </tr>
    `).join('');
  }
}

let allOfficersCache = [];
async function loadOfficers() {
  const res = await apiRequest('/officers');
  if (res.ok && res.data.data) {
    allOfficersCache = res.data.data;
    renderOfficersTable(allOfficersCache);
  }
}

function renderOfficersTable(officers) {
  const tbody = document.getElementById('officersTableBody');
  tbody.innerHTML = officers.map(o => `
    <tr>
      <td><code>${o.badge_no}</code></td>
      <td><strong>${o.first_name} ${o.last_name}</strong></td>
      <td><span class="badge badge-blue">${o.rank}</span></td>
      <td>${o.branch_name || o.branch_id}</td>
    </tr>
  `).join('');
}

function filterOfficers() {
  const q = document.getElementById('officerSearchInput').value.toLowerCase();
  const filtered = allOfficersCache.filter(o =>
    (o.first_name + ' ' + o.last_name).toLowerCase().includes(q) ||
    o.badge_no.toLowerCase().includes(q)
  );
  renderOfficersTable(filtered);
}

// ----------------------------------------------------------------------------
// Tab 3: Intake (Complainants, GDs, FIRs)
// ----------------------------------------------------------------------------
async function loadComplainants() {
  const res = await apiRequest('/complainants');
  const tbody = document.getElementById('complainantsTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(c => `
      <tr>
        <td>${c.complainant_id}</td>
        <td><strong>${c.name}</strong></td>
        <td>${(c.contacts || []).map(cnt => `<span class="badge badge-emerald">${cnt.contact_type}: ${cnt.contact_value}</span>`).join(' ')}</td>
      </tr>
    `).join('');
  }
}

async function loadGDs() {
  const res = await apiRequest('/gds');
  const tbody = document.getElementById('gdsTableBody');
  if (res.ok && res.data.data) {
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

async function loadFIRs() {
  const res = await apiRequest('/firs');
  const tbody = document.getElementById('firsTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(f => `
      <tr>
        <td><strong>${f.fir_number}</strong></td>
        <td><span class="badge badge-purple">${f.crime_category}</span></td>
        <td>${f.filed_date ? f.filed_date.split('T')[0] : '-'}</td>
        <td>${f.gd_number || 'Direct Filing'}</td>
        <td>${(f.legal_sections || []).map(s => `<span class="badge badge-amber" title="${s.section_title}">${s.section_code}</span>`).join(' ')}</td>
      </tr>
    `).join('');
  }
}

async function loadLegalSections() {
  const res = await apiRequest('/legal-sections');
  const container = document.getElementById('newFIRSectionsCheckboxContainer');
  if (res.ok && res.data.data && container) {
    container.innerHTML = res.data.data.map(s => `
      <label style="display:flex; align-items:center; gap:6px;">
        <input type="checkbox" name="fir_sections" value="${s.section_id}">
        <strong>${s.section_code}</strong>: ${s.section_title}
      </label>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 4: Cases & Dossier
// ----------------------------------------------------------------------------
async function loadCases() {
  const search = document.getElementById('caseSearchInput')?.value || '';
  const status = document.getElementById('caseStatusFilter')?.value || '';
  let endpoint = `/cases?search=${encodeURIComponent(search)}`;
  if (status) endpoint += `&status=${encodeURIComponent(status)}`;

  const res = await apiRequest(endpoint);
  const tbody = document.getElementById('casesTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(c => `
      <tr onclick="inspectCaseDossier(${c.case_id})" style="cursor:pointer;">
        <td><strong>#${c.case_id}</strong></td>
        <td>${c.case_title}</td>
        <td>${getStatusBadge(c.case_status)}</td>
        <td>${c.lead_officer_name || '-'}</td>
        <td><button class="btn-sm" onclick="inspectCaseDossier(${c.case_id}); event.stopPropagation();">Dossier</button></td>
      </tr>
    `).join('');
  }
}

let activeSelectedCaseID = null;
async function inspectCaseDossier(caseID) {
  activeSelectedCaseID = caseID;
  const container = document.getElementById('caseDossierContainer');
  const actions = document.getElementById('dossierActions');
  container.innerHTML = '<div class="placeholder-text">Loading dossier...</div>';

  const res = await apiRequest(`/cases/${caseID}`);
  if (res.ok && res.data.data) {
    const d = res.data.data;
    actions.classList.remove('hidden');

    container.innerHTML = `
      <div class="dossier-header">
        <h3 style="color:#60a5fa; font-size:16px;">${d.case.case_title}</h3>
        <div style="margin-top:6px; display:flex; gap:8px;">
          ${getStatusBadge(d.case.case_status)}
          <span class="badge badge-teal">FIR: ${d.case.fir_number || 'None'}</span>
          <span class="badge badge-blue">Lead: ${d.case.lead_officer_name || 'Unassigned'}</span>
        </div>
      </div>

      <div class="dossier-section">
        <h4>🚨 Linked Suspects (${d.suspects?.length || 0})</h4>
        ${(d.suspects && d.suspects.length > 0) ? d.suspects.map(s => `
          <div style="background:#111827; padding:8px 12px; border-radius:6px; margin-bottom:6px; border:1px solid #2d3748;">
            <strong>${s.first_name} ${s.last_name}</strong> — Risk: <span class="badge badge-rose">${s.suspicion_level}</span> | Role: <em>${s.role_in_crime || 'Suspect'}</em>
          </div>
        `).join('') : '<p style="color:#64748b; font-size:12px;">No suspects linked yet.</p>'}
      </div>

      <div class="dossier-section">
        <h4>📦 Registered Evidence (${d.evidence_items?.length || 0})</h4>
        ${(d.evidence_items && d.evidence_items.length > 0) ? d.evidence_items.map(e => `
          <div style="background:#111827; padding:8px 12px; border-radius:6px; margin-bottom:6px; border:1px solid #2d3748;">
            <strong>Item #${e.evidence_no}: ${e.title}</strong> — <span class="badge badge-purple">${e.evidence_type}</span> | Status: <span class="badge badge-emerald">${e.status}</span>
          </div>
        `).join('') : '<p style="color:#64748b; font-size:12px;">No evidence logged yet.</p>'}
      </div>

      <div class="dossier-section">
        <h4>📜 Status Transition History (`case_status_history`)</h4>
        ${(d.status_history && d.status_history.length > 0) ? d.status_history.map(h => `
          <div style="font-size:11.5px; margin-bottom:6px; padding-left:10px; border-left:2px solid #3b82f6;">
            <strong>${h.status}</strong> by <em>${h.changed_by || 'System'}</em> at ${h.changed_at ? h.changed_at.split('T')[0] : ''}
            <div style="color:#94a3b8;">${h.remarks || 'No remarks'}</div>
          </div>
        `).join('') : '<p style="color:#64748b; font-size:12px;">No lifecycle transitions logged.</p>'}
      </div>
    `;
  }
}

// ----------------------------------------------------------------------------
// Tab 5: Participants & Suspect Dossier
// ----------------------------------------------------------------------------
async function loadSuspects() {
  const res = await apiRequest('/suspects');
  const tbody = document.getElementById('suspectsTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(s => `
      <tr>
        <td>#${s.suspect_id}</td>
        <td><strong>${s.first_name} ${s.last_name}</strong></td>
        <td><span class="badge badge-${s.suspicion_level === 'High' ? 'rose' : 'amber'}">${s.suspicion_level}</span></td>
        <td>${s.status}</td>
        <td><button class="btn-sm" onclick="inspectSuspectDossier(${s.suspect_id})">Profile</button></td>
      </tr>
    `).join('');
  }
}

async function inspectSuspectDossier(suspectID) {
  const box = document.getElementById('suspectDossierBox');
  box.innerHTML = '<div class="placeholder-text">Loading criminal profile...</div>';

  const res = await apiRequest(`/suspects/${suspectID}/dossier`);
  if (res.ok && res.data.data) {
    const items = res.data.data;
    if (items.length === 0) {
      box.innerHTML = '<div class="placeholder-text">No cross-case history found for this suspect.</div>';
      return;
    }

    const first = items[0];
    box.innerHTML = `
      <div class="dossier-header">
        <h3 style="color:#f43f5e; font-size:16px;">${first.suspect_name}</h3>
        <p style="color:#94a3b8; font-size:12px; margin-top:4px;">
          Age: ${first.age || 'Unknown'} | Identification: <strong>${first.identification_sign || 'None'}</strong>
        </p>
      </div>

      <div class="dossier-section">
        <h4>Connected Criminal Cases (${items.length})</h4>
        ${items.map(i => `
          <div style="background:#111827; padding:10px 14px; border-radius:6px; margin-bottom:8px; border:1px solid #2d3748;">
            <strong>Case #${i.case_id}: ${i.case_title}</strong>
            <div style="font-size:12px; color:#cbd5e1; margin-top:4px;">
              Role: <span class="badge badge-rose">${i.role_in_crime || 'Suspect'}</span> | Status: ${getStatusBadge(i.case_status)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

async function loadVictims() {
  const res = await apiRequest('/victims');
  const tbody = document.getElementById('victimsTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(v => `
      <tr>
        <td>#${v.victim_id}</td>
        <td><strong>${v.name}</strong></td>
        <td>${v.phone || '-'}</td>
        <td>${v.condition_notes || 'Stable'}</td>
        <td>${v.is_deceased ? '<span class="badge badge-rose">Deceased</span>' : '<span class="badge badge-emerald">Surviving</span>'}</td>
      </tr>
    `).join('');
  }
}

async function loadWitnesses() {
  const res = await apiRequest('/witnesses');
  const tbody = document.getElementById('witnessesTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(w => `
      <tr>
        <td>#${w.witness_id}</td>
        <td><strong>${w.name}</strong></td>
        <td><span class="badge badge-blue">${w.reliability}</span></td>
        <td>${w.is_protected ? '<span class="badge badge-purple">Protected</span>' : '<span class="badge badge-teal">Standard</span>'}</td>
        <td>${w.statement_summary || '-'}</td>
      </tr>
    `).join('');
  }
}

async function loadLocations() {
  const res = await apiRequest('/locations');
  const tbody = document.getElementById('locationsTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(l => `
      <tr>
        <td>#${l.location_id}</td>
        <td><strong>${l.address}</strong></td>
        <td>${l.area}</td>
        <td>${l.city}</td>
        <td><code>${l.gps_coordinates || 'N/A'}</code></td>
      </tr>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// Tab 6: Evidence & Chain of Custody
// ----------------------------------------------------------------------------
async function loadEvidence() {
  const res = await apiRequest('/evidence');
  const tbody = document.getElementById('evidenceTableBody');
  if (res.ok && res.data.data) {
    tbody.innerHTML = res.data.data.map(e => `
      <tr onclick="inspectEvidenceChain(${e.evidence_id})" style="cursor:pointer;">
        <td>Case #${e.case_id}</td>
        <td><code>Item #${e.evidence_no}</code></td>
        <td><strong>${e.title}</strong></td>
        <td><span class="badge badge-purple">${e.evidence_type}</span></td>
        <td><span class="badge badge-emerald">${e.status}</span></td>
        <td><button class="btn-sm" onclick="inspectEvidenceChain(${e.evidence_id}); event.stopPropagation();">Chain</button></td>
      </tr>
    `).join('');
  }
}

let activeSelectedEvidenceID = null;
async function inspectEvidenceChain(evidenceID) {
  activeSelectedEvidenceID = evidenceID;
  const container = document.getElementById('chainTimelineContainer');
  const btn = document.getElementById('btnUpdateEvidenceStatus');
  container.innerHTML = '<div class="placeholder-text">Loading chain of custody audit trail...</div>';

  const res = await apiRequest(`/evidence/${evidenceID}/chain`);
  if (res.ok && res.data.data) {
    const logs = res.data.data;
    btn.classList.remove('hidden');

    if (logs.length === 0) {
      container.innerHTML = '<div class="placeholder-text">No chain logs found.</div>';
      return;
    }

    const first = logs[0];
    container.innerHTML = `
      <div class="dossier-header">
        <h3 style="color:#a855f7; font-size:16px;">${first.evidence_title} (Item #${first.evidence_no})</h3>
        <p style="color:#94a3b8; font-size:12px; margin-top:4px;">
          Case: <strong>${first.case_title}</strong> | Vault Location: <code>${first.storage_location || 'N/A'}</code>
        </p>
      </div>

      <div class="dossier-section">
        <h4>⛓️ Chain of Custody History (${logs.length} Transitions)</h4>
        ${logs.map((log, idx) => `
          <div style="position:relative; padding-left:20px; margin-bottom:14px; border-left:2px solid #a855f7;">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
              <span class="badge badge-emerald">${log.logged_status}</span>
              <span style="color:#64748b;">${log.changed_at ? log.changed_at.replace('T', ' ').split('.')[0] : ''}</span>
            </div>
            <div style="font-size:12px; margin-top:4px;">
              Officer/User: <strong>${log.updated_by_officer || log.updated_by_username || 'System'}</strong>
            </div>
            <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">
              ${log.remarks || 'No transition remarks'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ----------------------------------------------------------------------------
// Tab 7: SQL Views Inspector
// ----------------------------------------------------------------------------
async function loadViewData(viewName) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText.includes(viewName)) btn.classList.add('active');
  });

  document.getElementById('currentViewTitle').innerText = `View: ${viewName}`;
  const thead = document.getElementById('viewDynamicHead');
  const tbody = document.getElementById('viewDynamicBody');
  const countBadge = document.getElementById('viewRowCount');

  thead.innerHTML = '';
  tbody.innerHTML = '<tr><td colspan="8" class="text-center">Fetching SQL view data...</td></tr>';

  let endpoint = '';
  if (viewName === 'v_case_overview') endpoint = '/cases';
  if (viewName === 'v_officer_caseload') endpoint = '/officers/caseload';
  if (viewName === 'v_fir_case_pipeline') endpoint = '/analytics/pipeline';
  if (viewName === 'v_evidence_chain_of_custody') endpoint = '/evidence/1/chain';
  if (viewName === 'v_suspect_dossier') endpoint = '/suspects/1/dossier';

  const res = await apiRequest(endpoint);
  if (res.ok && res.data.data) {
    const rows = res.data.data;
    countBadge.innerText = `${rows.length} rows`;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No rows returned.</td></tr>';
      return;
    }

    const keys = Object.keys(rows[0]);
    thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    tbody.innerHTML = rows.map(r => `
      <tr>${keys.map(k => `<td>${r[k] !== null && r[k] !== undefined ? r[k] : '<em style="color:#64748b">null</em>'}</td>`).join('')}</tr>
    `).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="color:#f43f5e;">Error: ${res.data?.error || res.error}</td></tr>`;
  }
}

// ----------------------------------------------------------------------------
// Tab 8: Raw HTTP API Console
// ----------------------------------------------------------------------------
async function sendConsoleRequest() {
  const method = document.getElementById('consoleMethod').value;
  const endpoint = document.getElementById('consoleEndpoint').value;
  const bodyText = document.getElementById('consoleRequestBody').value;
  const statusBadge = document.getElementById('consoleStatus');
  const timeBadge = document.getElementById('consoleTime');
  const output = document.getElementById('consoleResponseBody');

  let body = null;
  if (bodyText && (method === 'POST' || method === 'PUT')) {
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      alert('Invalid JSON in Request Body!');
      return;
    }
  }

  output.innerText = '// Sending request...';
  const res = await apiRequest(endpoint, method, body);

  statusBadge.innerText = `${res.status} ${res.ok ? 'OK' : 'ERROR'}`;
  statusBadge.className = `badge badge-${res.ok ? 'emerald' : 'rose'}`;
  timeBadge.innerText = `${res.latency} ms`;
  output.innerText = JSON.stringify(res.data || res.error, null, 2);
}

// ----------------------------------------------------------------------------
// Modal Controllers & Form Submissions
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
    showToast('Case status updated successfully!', 'success');
    closeAllModals();
    inspectCaseDossier(caseID);
    loadCases();
  } else {
    showToast(res.data?.error || 'Failed to update case status', 'error');
  }
}

function openEvidenceStatusModal() {
  if (!activeSelectedEvidenceID) return;
  document.getElementById('modalEvidenceID').value = activeSelectedEvidenceID;
  openModal('evidenceStatusModal');
}

async function submitEvidenceStatusTransition() {
  const evidenceID = document.getElementById('modalEvidenceID').value;
  const status = document.getElementById('modalEvidenceStatusSelect').value;
  const storage_location = document.getElementById('modalEvidenceLocation').value;
  const remarks = document.getElementById('modalEvidenceRemarks').value;

  const res = await apiRequest(`/evidence/${evidenceID}/status`, 'PUT', { status, storage_location, remarks });
  if (res.ok) {
    showToast('Evidence custody status logged successfully!', 'success');
    closeAllModals();
    inspectEvidenceChain(evidenceID);
    loadEvidence();
  } else {
    showToast(res.data?.error || 'Failed to update evidence custody', 'error');
  }
}

async function submitCreateBranch() {
  const branch_name = document.getElementById('newBranchName').value;
  const district = document.getElementById('newBranchDistrict').value;

  const res = await apiRequest('/branches', 'POST', { branch_name, district });
  if (res.ok) {
    showToast('Branch added successfully!', 'success');
    closeAllModals();
    loadBranches();
  } else {
    showToast(res.data?.error || 'Error adding branch', 'error');
  }
}

async function submitCreateOfficer() {
  const badge_no = document.getElementById('newOfficerBadge').value;
  const first_name = document.getElementById('newOfficerFirstName').value;
  const last_name = document.getElementById('newOfficerLastName').value;
  const rank = document.getElementById('newOfficerRank').value;
  const branch_id = parseInt(document.getElementById('newOfficerBranchSelect').value, 10);

  const res = await apiRequest('/officers', 'POST', { badge_no, first_name, last_name, rank, branch_id });
  if (res.ok) {
    showToast('Officer registered successfully!', 'success');
    closeAllModals();
    loadOfficers();
  } else {
    showToast(res.data?.error || 'Error creating officer', 'error');
  }
}

async function submitCreateComplainant() {
  const name = document.getElementById('newCompName').value;
  const phone = document.getElementById('newCompPhone').value;
  const email = document.getElementById('newCompEmail').value;

  const contacts = [{ contact_type: 'phone', contact_value: phone, is_primary: true }];
  if (email) contacts.push({ contact_type: 'email', contact_value: email, is_primary: false });

  const res = await apiRequest('/complainants', 'POST', { name, contacts });
  if (res.ok) {
    showToast('Complainant registered successfully!', 'success');
    closeAllModals();
    loadComplainants();
  } else {
    showToast(res.data?.error || 'Error adding complainant', 'error');
  }
}

async function submitCreateGD() {
  const gd_number = document.getElementById('newGDNumber').value;
  const gd_date = document.getElementById('newGDDate').value;
  const complainant_id = parseInt(document.getElementById('newGDComplainantSelect').value, 10);
  const subject = document.getElementById('newGDSubject').value;

  const res = await apiRequest('/gds', 'POST', { gd_number, gd_date, complainant_id, subject });
  if (res.ok) {
    showToast('General Diary entry recorded!', 'success');
    closeAllModals();
    loadGDs();
  } else {
    showToast(res.data?.error || 'Error filing GD', 'error');
  }
}

async function submitCreateFIR() {
  const fir_number = document.getElementById('newFIRNumber').value;
  const filed_date = document.getElementById('newFIRDate').value;
  const crime_category = document.getElementById('newFIRCategory').value;
  const gdVal = document.getElementById('newFIRGDSelect').value;
  const gd_id = gdVal ? parseInt(gdVal, 10) : null;

  const checkboxes = document.querySelectorAll('input[name="fir_sections"]:checked');
  const section_ids = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));

  const res = await apiRequest('/firs', 'POST', { fir_number, filed_date, crime_category, gd_id, section_ids });
  if (res.ok) {
    showToast('First Information Report filed!', 'success');
    closeAllModals();
    loadFIRs();
  } else {
    showToast(res.data?.error || 'Error filing FIR', 'error');
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
    showToast('Case opened successfully!', 'success');
    closeAllModals();
    loadCases();
  } else {
    showToast(res.data?.error || 'Error opening case', 'error');
  }
}

async function submitCreateSuspect() {
  const first_name = document.getElementById('newSuspectFirstName').value;
  const last_name = document.getElementById('newSuspectLastName').value;
  const ageVal = document.getElementById('newSuspectAge').value;
  const age = ageVal ? parseInt(ageVal, 10) : null;
  const suspicion_level = document.getElementById('newSuspectLevel').value;
  const identification_sign = document.getElementById('newSuspectSign').value;

  const res = await apiRequest('/suspects', 'POST', { first_name, last_name, age, suspicion_level, identification_sign, status: 'Under Investigation' });
  if (res.ok) {
    showToast('Suspect registered!', 'success');
    closeAllModals();
    loadSuspects();
  } else {
    showToast(res.data?.error || 'Error adding suspect', 'error');
  }
}

async function submitCreateEvidence() {
  const case_id = parseInt(document.getElementById('newEvidenceCaseSelect').value, 10);
  const title = document.getElementById('newEvidenceTitle').value;
  const evidence_type = document.getElementById('newEvidenceType').value;
  const storage_location = document.getElementById('newEvidenceStorage').value;
  const description = document.getElementById('newEvidenceDesc').value;

  const res = await apiRequest('/evidence', 'POST', { case_id, title, evidence_type, storage_location, description });
  if (res.ok) {
    showToast('Evidence registered & custody initiated!', 'success');
    closeAllModals();
    loadEvidence();
  } else {
    showToast(res.data?.error || 'Error creating evidence', 'error');
  }
}

// ----------------------------------------------------------------------------
// Dropdown Hydration Helpers
// ----------------------------------------------------------------------------
async function populateCaseModalDropdowns() {
  const fRes = await apiRequest('/firs');
  const firSelect = document.getElementById('newCaseFIRSelect');
  if (fRes.ok && fRes.data.data && firSelect) {
    firSelect.innerHTML = '<option value="">-- No Linked FIR --</option>' +
      fRes.data.data.map(f => `<option value="${f.fir_id}">${f.fir_number} (${f.crime_category})</option>`).join('');
  }

  const oRes = await apiRequest('/officers');
  const oSelect = document.getElementById('newCaseOfficerSelect');
  const bSelect = document.getElementById('newOfficerBranchSelect');
  if (oRes.ok && oRes.data.data && oSelect) {
    oSelect.innerHTML = oRes.data.data.map(o => `<option value="${o.officer_id}">${o.first_name} ${o.last_name} (${o.badge_no} - ${o.rank})</option>`).join('');
  }

  const bRes = await apiRequest('/branches');
  if (bRes.ok && bRes.data.data && bSelect) {
    bSelect.innerHTML = bRes.data.data.map(b => `<option value="${b.branch_id}">${b.branch_name} (${b.district})</option>`).join('');
  }
}

async function populateEvidenceModalDropdowns() {
  const cRes = await apiRequest('/cases');
  const cSelect = document.getElementById('newEvidenceCaseSelect');
  if (cRes.ok && cRes.data.data && cSelect) {
    cSelect.innerHTML = cRes.data.data.map(c => `<option value="${c.case_id}">Case #${c.case_id}: ${c.case_title}</option>`).join('');
  }
}

function getStatusBadge(status) {
  if (status === 'Open' || status === 'Reopened') return `<span class="badge badge-emerald">${status}</span>`;
  if (status === 'Under Investigation') return `<span class="badge badge-blue">${status}</span>`;
  if (status === 'Pending Review') return `<span class="badge badge-amber">${status}</span>`;
  if (status === 'Closed' || status === 'Archived') return `<span class="badge badge-purple">${status}</span>`;
  return `<span class="badge badge-teal">${status}</span>`;
}

// ----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('apiBaseUrl');
  if (input) {
    input.value = getBaseUrl();
  }

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = ['newGDDate', 'newFIRDate', 'newCaseOpenedDate'];
  dateInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  verifySession();
});
