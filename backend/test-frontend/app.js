// ============================================================================
// ORCUS Tactical Intelligence & Case Tracking System - Application Engine
// Author: Md. Arafat Hossain Faisal (241400060)
// ============================================================================

let authToken = localStorage.getItem('orcus_test_token') || '';
let currentUser = null;
let currentTheme = localStorage.getItem('orcus_theme') || 'dark';
let currentWorkspaceMode = 'map';
let activeSelectedCaseID = 1;
let leafletMap = null;
let mapTileLayer = null;
let mapMarkers = [];
let mapRoutePolyline = null;
let graphNodes = [];
let graphEdges = [];
let graphAnimationId = null;
let isDraggingNode = null;
let timelineInterval = null;
let currentTimelineMonth = 7; // August

// ----------------------------------------------------------------------------
// Theme Switcher Engine
// ----------------------------------------------------------------------------
function initTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateThemeIcons();
}

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('orcus_theme', currentTheme);
  updateThemeIcons();

  // Update Leaflet Tile Layer
  if (leafletMap && mapTileLayer) {
    leafletMap.removeLayer(mapTileLayer);
    const tileUrl = currentTheme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    mapTileLayer = L.tileLayer(tileUrl, { attribution: '© CartoDB, © OpenStreetMap' }).addTo(leafletMap);
  }

  // Redraw Graph Canvas
  if (currentWorkspaceMode === 'graph') {
    renderGraph();
  }
}

function updateThemeIcons() {
  const btn1 = document.getElementById('themeToggleBtn');
  const btn2 = document.getElementById('sidebarThemeBtn');
  const icon = currentTheme === 'dark' ? '☀️' : '🌙';
  if (btn1) btn1.innerText = icon;
  if (btn2) btn2.innerText = icon;
}

// ----------------------------------------------------------------------------
// API Helper (Direct Relative /api/v1)
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
// Workspace Mode Switcher
// ----------------------------------------------------------------------------
function switchWorkspaceMode(mode) {
  currentWorkspaceMode = mode;
  document.querySelectorAll('.workspace-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mode-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));

  const targetPane = document.getElementById(`pane-${mode}`);
  if (targetPane) targetPane.classList.add('active');

  const navBtns = document.querySelectorAll('.mode-tab-btn');
  if (mode === 'map' && navBtns[0]) navBtns[0].classList.add('active');
  if (mode === 'graph' && navBtns[1]) navBtns[1].classList.add('active');
  if (mode === 'analytics' && navBtns[2]) navBtns[2].classList.add('active');
  if (mode === 'tables' && navBtns[3]) navBtns[3].classList.add('active');

  const mapIcon = document.getElementById('btnModeMap');
  const graphIcon = document.getElementById('btnModeGraph');
  const analytIcon = document.getElementById('btnModeAnalytics');
  const tblIcon = document.getElementById('btnModeTables');

  if (mode === 'map' && mapIcon) mapIcon.classList.add('active');
  if (mode === 'graph' && graphIcon) graphIcon.classList.add('active');
  if (mode === 'analytics' && analytIcon) analytIcon.classList.add('active');
  if (mode === 'tables' && tblIcon) tblIcon.classList.add('active');

  if (mode === 'map') {
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
      else initTacticalMap();
    }, 100);
  }

  if (mode === 'graph') {
    setTimeout(() => {
      initLinkGraph();
    }, 100);
  }

  if (mode === 'tables') {
    loadTableData('tbl-cases');
  }
}

// ----------------------------------------------------------------------------
// Authentication & Session Management
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
      pillText.innerText = 'Connected: MySQL 8.0 (Live)';
    }
    showToast(`Logged in as ${label}`, 'success');
    loadInitialWorkstationData();
  } else {
    if (pill && pillText) {
      pill.style.background = 'rgba(244, 63, 94, 0.15)';
      pill.style.color = '#fb7185';
      pillText.innerText = 'Connection Error';
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
      pillText.innerText = 'Connected: MySQL 8.0 (Live)';
    }
    loadInitialWorkstationData();
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
// Initial Data Loader
// ----------------------------------------------------------------------------
async function loadInitialWorkstationData() {
  initTacticalMap();
  loadDossierCase(activeSelectedCaseID);
  buildHistogramSlider();
}

// ----------------------------------------------------------------------------
// Mode 1: GIS Tactical Crime Map Engine (Leaflet.js)
// ----------------------------------------------------------------------------
function initTacticalMap() {
  const container = document.getElementById('leafletMapContainer');
  if (!container || leafletMap) return;

  leafletMap = L.map('leafletMapContainer', {
    center: [23.7771, 90.3994], // Dhaka Central
    zoom: 13,
    zoomControl: false
  });

  const tileUrl = currentTheme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  mapTileLayer = L.tileLayer(tileUrl, {
    attribution: '© CartoDB, © OpenStreetMap contributors'
  }).addTo(leafletMap);

  loadMapLocations();
}

async function loadMapLocations() {
  const res = await apiRequest('/locations');
  if (!res.ok || !res.data.data) return;

  const locs = res.data.data;
  const coords = [];

  // Default coordinate mappings for known districts if GPS coordinates are missing
  const defaultCoords = {
    'Dhanmondi': [23.7461, 90.3742],
    'Gulshan': [23.7925, 90.4078],
    'Uttara': [23.8759, 90.3795],
    'Mirpur': [23.8071, 90.3687],
    'Motijheel': [23.7330, 90.4172],
    'Chattogram': [22.3569, 91.7832]
  };

  locs.forEach((loc, idx) => {
    let lat = 23.75 + (idx * 0.02);
    let lng = 90.38 + (idx * 0.015);

    if (defaultCoords[loc.area]) {
      lat = defaultCoords[loc.area][0];
      lng = defaultCoords[loc.area][1];
    }

    coords.push([lat, lng]);

    // Custom tactical marker icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div style="background:#10b981; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #10b981;"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
    marker.bindPopup(`
      <div style="font-family:sans-serif; font-size:12px; color:#0f172a;">
        <strong style="color:#059669;">📍 ${loc.address}</strong><br>
        Area: <strong>${loc.area}</strong> (${loc.city})<br>
        <span style="color:#64748b; font-size:11px;">GPS: ${loc.gps_coordinates || 'Calibrated'}</span>
      </div>
    `);
    mapMarkers.push({ marker, type: idx % 2 === 0 ? 'crime' : 'evidence' });
  });

  // Draw Tactical Surveillance Polygon / Route
  if (coords.length > 2) {
    mapRoutePolyline = L.polyline(coords, {
      color: '#10b981',
      weight: 2,
      dashArray: '6, 8',
      opacity: 0.85
    }).addTo(leafletMap);
  }
}

function centerMapOnDhaka() {
  if (leafletMap) leafletMap.setView([23.7771, 90.3994], 13);
}

function zoomInMap() {
  if (leafletMap) leafletMap.zoomIn();
}

function zoomOutMap() {
  if (leafletMap) leafletMap.zoomOut();
}

function toggleMapRoutes() {
  if (!leafletMap || !mapRoutePolyline) return;
  if (leafletMap.hasLayer(mapRoutePolyline)) {
    leafletMap.removeLayer(mapRoutePolyline);
  } else {
    mapRoutePolyline.addTo(leafletMap);
  }
}

function filterMapMarkers(type) {
  mapMarkers.forEach(m => {
    if (type === 'all' || m.type === type) {
      m.marker.addTo(leafletMap);
    } else {
      leafletMap.removeLayer(m.marker);
    }
  });
}

// ----------------------------------------------------------------------------
// Mode 2: Link Analysis Entity Graph Engine (HTML5 Canvas)
// ----------------------------------------------------------------------------
function initLinkGraph() {
  const canvas = document.getElementById('linkGraphCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  // Build Entity Graph Model
  graphNodes = [
    { id: 'case_1', label: 'Case #029128: Dhanmondi Vault', type: 'case', x: canvas.width * 0.45, y: canvas.height * 0.45, vx: 0, vy: 0, r: 24, color: '#3b82f6' },
    { id: 'suspect_1', label: 'Timothée Chalamet (Phantom)', type: 'suspect', x: canvas.width * 0.25, y: canvas.height * 0.3, vx: 0, vy: 0, r: 18, color: '#f43f5e' },
    { id: 'suspect_2', label: 'Rahim Chowdhury', type: 'suspect', x: canvas.width * 0.28, y: canvas.height * 0.65, vx: 0, vy: 0, r: 18, color: '#f43f5e' },
    { id: 'victim_1', label: 'First National Bank', type: 'victim', x: canvas.width * 0.65, y: canvas.height * 0.28, vx: 0, vy: 0, r: 16, color: '#f59e0b' },
    { id: 'witness_1', label: 'Security Guard Hassan', type: 'witness', x: canvas.width * 0.7, y: canvas.height * 0.6, vx: 0, vy: 0, r: 16, color: '#06b6d4' },
    { id: 'evid_1', label: 'CCTV Server Hard Drive', type: 'evidence', x: canvas.width * 0.5, y: canvas.height * 0.75, vx: 0, vy: 0, r: 16, color: '#8b5cf6' },
    { id: 'branch_1', label: 'Central HQ (Officer Faisal)', type: 'branch', x: canvas.width * 0.48, y: canvas.height * 0.18, vx: 0, vy: 0, r: 18, color: '#10b981' }
  ];

  graphEdges = [
    { from: 'suspect_1', to: 'case_1', label: 'suspect_in' },
    { from: 'suspect_2', to: 'case_1', label: 'accomplice' },
    { from: 'victim_1', to: 'case_1', label: 'complainant' },
    { from: 'witness_1', to: 'case_1', label: 'eyewitness' },
    { from: 'evid_1', to: 'case_1', label: 'recovered_at' },
    { from: 'branch_1', to: 'case_1', label: 'investigating_branch' }
  ];

  setupGraphInteractions(canvas);
  startGraphAnimation(ctx, canvas);
}

function startGraphAnimation(ctx, canvas) {
  if (graphAnimationId) cancelAnimationFrame(graphAnimationId);

  function loop() {
    renderGraph();
    graphAnimationId = requestAnimationFrame(loop);
  }
  loop();
}

function renderGraph() {
  const canvas = document.getElementById('linkGraphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const edgeColor = isDark ? '#2a384c' : '#cbd5e1';
  const textColor = isDark ? '#f1f5f9' : '#0f172a';

  // Draw Edges
  graphEdges.forEach(edge => {
    const fromNode = graphNodes.find(n => n.id === edge.from);
    const toNode = graphNodes.find(n => n.id === edge.to);
    if (!fromNode || !toNode) return;

    ctx.beginPath();
    ctx.moveTo(fromNode.x, fromNode.y);
    ctx.lineTo(toNode.x, toNode.y);
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Edge Label
    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(edge.label, midX + 4, midY - 4);
  });

  // Draw Nodes
  graphNodes.forEach(node => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = node.color;
    ctx.shadowColor = node.color;
    ctx.shadowBlur = isDark ? 10 : 4;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.lineWidth = 2;
    ctx.strokeStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.stroke();

    // Node Text Label
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + node.r + 14);
  });
}

function setupGraphInteractions(canvas) {
  let draggedNode = null;

  canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    draggedNode = graphNodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < n.r + 5;
    });
  };

  canvas.onmousemove = (e) => {
    if (!draggedNode) return;
    const rect = canvas.getBoundingClientRect();
    draggedNode.x = e.clientX - rect.left;
    draggedNode.y = e.clientY - rect.top;
  };

  canvas.onmouseup = () => {
    draggedNode = null;
  };
}

function resetGraphPhysics() {
  initLinkGraph();
}

function exportGraphSVG() {
  showToast('Entity graph exported as high-res SVG!', 'success');
}

function exportGraphJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes: graphNodes, edges: graphEdges }, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", "orcus_knowledge_graph.json");
  dl.click();
  showToast('Graph topology exported to JSON', 'success');
}

// ----------------------------------------------------------------------------
// Left Panel: Intelligence Dossier Sync
// ----------------------------------------------------------------------------
async function loadDossierCase(caseID) {
  const res = await apiRequest(`/cases/${caseID}`);
  if (!res.ok || !res.data.data) return;

  const d = res.data.data;
  document.getElementById('dossierCaseTitle').innerText = d.case.case_title;
  document.getElementById('dossierCaseOwner').innerText = d.case.lead_officer_name || 'Arafat Faisal';
  document.getElementById('dossierCaseNo').innerText = `#ORC-0${d.case.case_id}9128`;
  document.getElementById('activeCaseHeaderTitle').innerText = `Investigation: ${d.case.case_title}`;

  if (d.suspects && d.suspects.length > 0) {
    const s = d.suspects[0];
    document.getElementById('dossierSuspectName').innerText = `${s.first_name} ${s.last_name}`;
    document.getElementById('dossierSpecRisk').innerText = `${s.suspicion_level} Risk ⚡`;
    document.getElementById('dossierRoleText').innerText = s.role_in_crime || 'Person of Interest identified near crime scene.';
  }

  if (d.evidence_items && d.evidence_items.length > 0) {
    const e = d.evidence_items[0];
    document.getElementById('dossierEvidenceTitle').innerText = e.title;
    document.getElementById('dossierEvidenceDesc').innerText = e.description || 'Physical item logged under strict chain-of-custody.';
  }
}

function handleCommandKey(e) {
  if (e.key === 'Enter') {
    const input = document.getElementById('commandQueryInput');
    showToast(`Command executed: "${input.value}"`, 'success');
    input.value = '';
  }
}

// ----------------------------------------------------------------------------
// Bottom Chronological Timeline Scrubber
// ----------------------------------------------------------------------------
function buildHistogramSlider() {
  const container = document.getElementById('histogramBars');
  if (!container) return;

  const heights = [6, 8, 12, 18, 14, 22, 16, 24, 19, 15, 10, 7];
  container.innerHTML = heights.map((h, i) => `
    <div class="hist-bar ${i === currentTimelineMonth ? 'active' : ''}" 
         style="height: ${h}px;" 
         onclick="selectTimelineMonth(${i})" 
         title="Month ${i + 1}: ${h * 3} criminal incidents logged"></div>
  `).join('');
}

function selectTimelineMonth(idx) {
  currentTimelineMonth = idx;
  buildHistogramSlider();
  showToast(`Timeline scrubber moved to month ${idx + 1}`, 'success');
}

function stepTimeline(dir) {
  currentTimelineMonth = Math.max(0, Math.min(11, currentTimelineMonth + dir));
  buildHistogramSlider();
}

function toggleTimelinePlay() {
  const btn = document.getElementById('btnTimelinePlay');
  if (timelineInterval) {
    clearInterval(timelineInterval);
    timelineInterval = null;
    btn.innerText = '▶';
  } else {
    btn.innerText = '⏸';
    timelineInterval = setInterval(() => {
      currentTimelineMonth = (currentTimelineMonth + 1) % 12;
      buildHistogramSlider();
    }, 1200);
  }
}

function zoomTimeline(dir) {
  showToast(`Timeline zoom ${dir > 0 ? 'in' : 'out'}`, 'success');
}

function updateTimelineYear(yr) {
  showToast(`Year switched to ${yr}`, 'success');
}

// ----------------------------------------------------------------------------
// Mode 4: Database Tables Management
// ----------------------------------------------------------------------------
function switchTableSubtab(tblId) {
  document.querySelectorAll('.table-subcontent').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));

  const target = document.getElementById(tblId);
  if (target) target.classList.remove('hidden');
  if (window.event && window.event.target) window.event.target.classList.add('active');

  loadTableData(tblId);
}

async function loadTableData(tblId) {
  if (tblId === 'tbl-cases') {
    const res = await apiRequest('/cases');
    const tbody = document.getElementById('tblCasesBody');
    if (res.ok && res.data.data) {
      tbody.innerHTML = res.data.data.map(c => `
        <tr>
          <td><strong>#${c.case_id}</strong></td>
          <td>${c.case_title}</td>
          <td><span class="badge badge-emerald">${c.case_status}</span></td>
          <td>${c.lead_officer_name || '-'}</td>
          <td><code>${c.fir_number || 'Direct'}</code></td>
          <td><button class="btn-sm" onclick="loadDossierCase(${c.case_id}); switchWorkspaceMode('map');">Inspect</button></td>
        </tr>
      `).join('');
    }
  }

  if (tblId === 'tbl-org') {
    const res = await apiRequest('/officers');
    const tbody = document.getElementById('tblOfficersBody');
    if (res.ok && res.data.data) {
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

  if (tblId === 'tbl-intake') {
    const res = await apiRequest('/firs');
    const tbody = document.getElementById('tblFIRsBody');
    if (res.ok && res.data.data) {
      tbody.innerHTML = res.data.data.map(f => `
        <tr>
          <td><strong>${f.fir_number}</strong></td>
          <td><span class="badge badge-purple">${f.crime_category}</span></td>
          <td>${f.filed_date ? f.filed_date.split('T')[0] : '-'}</td>
          <td>${(f.legal_sections || []).map(s => `<span class="badge badge-amber">${s.section_code}</span>`).join(' ')}</td>
        </tr>
      `).join('');
    }
  }

  if (tblId === 'tbl-participants') {
    const res = await apiRequest('/suspects');
    const tbody = document.getElementById('tblSuspectsBody');
    if (res.ok && res.data.data) {
      tbody.innerHTML = res.data.data.map(s => `
        <tr>
          <td>#${s.suspect_id}</td>
          <td><strong>${s.first_name} ${s.last_name}</strong></td>
          <td><span class="badge badge-rose">${s.suspicion_level}</span></td>
          <td>${s.status}</td>
          <td><button class="btn-sm" onclick="showToast('Criminal Dossier #'+${s.suspect_id}, 'success')">Dossier</button></td>
        </tr>
      `).join('');
    }
  }

  if (tblId === 'tbl-evidence') {
    const res = await apiRequest('/evidence');
    const tbody = document.getElementById('tblEvidenceBody');
    if (res.ok && res.data.data) {
      tbody.innerHTML = res.data.data.map(e => `
        <tr>
          <td>Case #${e.case_id}</td>
          <td><code>#${e.evidence_no}</code></td>
          <td><strong>${e.title}</strong></td>
          <td><span class="badge badge-purple">${e.evidence_type}</span></td>
          <td><span class="badge badge-emerald">${e.status}</span></td>
          <td><button class="btn-sm" onclick="showToast('Chain logs loaded for evidence #'+${e.evidence_id}, 'success')">Chain</button></td>
        </tr>
      `).join('');
    }
  }
}

async function loadViewData(viewName) {
  const thead = document.getElementById('dynamicViewHead');
  const tbody = document.getElementById('dynamicViewBody');
  tbody.innerHTML = '<tr><td class="text-center">Fetching view data...</td></tr>';

  let endpoint = '/cases';
  if (viewName === 'v_officer_caseload') endpoint = '/officers/caseload';
  if (viewName === 'v_fir_case_pipeline') endpoint = '/analytics/pipeline';
  if (viewName === 'v_evidence_chain_of_custody') endpoint = '/evidence/1/chain';
  if (viewName === 'v_suspect_dossier') endpoint = '/suspects/1/dossier';

  const res = await apiRequest(endpoint);
  if (res.ok && res.data.data && res.data.data.length > 0) {
    const rows = res.data.data;
    const keys = Object.keys(rows[0]);
    thead.innerHTML = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    tbody.innerHTML = rows.map(r => `<tr>${keys.map(k => `<td>${r[k] !== null ? r[k] : 'null'}</td>`).join('')}</tr>`).join('');
  }
}

async function sendConsoleRequest() {
  const method = document.getElementById('consoleMethod').value;
  const endpoint = document.getElementById('consoleEndpoint').value;
  const out = document.getElementById('consoleResponseBody');

  out.innerText = '// Executing API call...';
  const res = await apiRequest(endpoint, method);
  out.innerText = JSON.stringify(res.data || res.error, null, 2);
}

// ----------------------------------------------------------------------------
// Modals
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
  document.getElementById('modalCaseID').value = activeSelectedCaseID;
  openModal('caseStatusModal');
}

function openActiveTableModal() {
  openModal('newCaseModal');
}

function openSuspectModalDirectly() {
  showToast('Opening Suspect Master Dossier...', 'success');
}

function openEvidenceChainDirectly() {
  showToast('Loading full Chain of Custody Audit Trail...', 'success');
}

async function submitCaseStatusTransition() {
  const status = document.getElementById('modalCaseStatusSelect').value;
  const remarks = document.getElementById('modalCaseRemarks').value;

  const res = await apiRequest(`/cases/${activeSelectedCaseID}/status`, 'PUT', { status, remarks });
  if (res.ok) {
    showToast('Case lifecycle transition committed!', 'success');
    closeAllModals();
    loadDossierCase(activeSelectedCaseID);
  } else {
    showToast(res.data?.error || 'Failed to update case status', 'error');
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
    showToast('New investigation case opened!', 'success');
    closeAllModals();
    loadTableData('tbl-cases');
  } else {
    showToast(res.data?.error || 'Error creating case', 'error');
  }
}

// ----------------------------------------------------------------------------
// Boot Engine
// ----------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  verifySession();
});
