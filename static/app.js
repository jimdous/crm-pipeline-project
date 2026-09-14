"use strict";

const $ = (id) => document.getElementById(id);
const STAGES = ["New Lead", "Contacted", "Qualified", "Showing Scheduled", "Negotiating", "Closed Won", "Closed Lost"];
const base = (window.CRM_API_BASE || "").replace(/\/$/, "");
const state = {key: "", view: "overview", offset: 0, total: 0, limit: 10, editing: null, publicDemo: false, ready: false, loaded: false, saving: false, today: null, request: 0, refresh: 0, controller: null};
const money = (value) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 2}).format(Number(value || 0));
const compactMoney = (value) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2}).format(Number(value || 0));
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const localDate = () => state.today || new Date().toISOString().slice(0, 10);
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : "Never contacted";

async function api(path, options = {}) {
  const headers = { ...(options.body ? {"Content-Type": "application/json"} : {}), ...(state.key ? {Authorization: `Bearer ${state.key}`} : {}), ...options.headers };
  let response;
  try {
    response = await fetch(base + path, {...options, headers, signal: options.signal || AbortSignal.timeout(15000)});
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Unable to connect. Please try Refresh in a moment.");
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && state.key) {
      lockWorkspace();
      showError("Your access key was rejected. Unlock the workspace to try again.");
    }
    const detail = body?.detail;
    const message = Array.isArray(detail) ? detail.map((e) => `${(e.loc || []).filter((p) => p !== "body").join(".") || "Lead"}: ${e.msg}`).join("\n") : detail;
    const error = new Error(message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  if (!body) throw new Error("This page needs the FastAPI server. Run the backend or configure its HTTPS URL in static/config.js.");
  return body;
}

function showError(message) { $("error").textContent = message; $("error").hidden = !message; }
let toastTimer;
function toast(message) { clearTimeout(toastTimer); $("toast").textContent = message; $("toast").hidden = false; toastTimer = setTimeout(() => $("toast").hidden = true, 5000); }
function accessState() {
  $("new-lead").disabled = !state.key || state.saving;
  $("access-button").textContent = state.key ? "Lock workspace" : state.publicDemo ? "Unlock editing" : "Unlock workspace";
}

function lockWorkspace() {
  state.key = "";
  state.refresh++;
  state.request++;
  state.controller?.abort();
  state.editing = null;
  $("lead-dialog").close();
  $("delete-dialog").close();
  $("lead-form").reset();
  $("refresh").disabled = false;
  accessState();
  if (!state.publicDemo) {
    $("dashboard").hidden = true;
    for (const id of ["lead-rows", "kpis", "agents", "sources", "stages", "agent-options", "source-options"]) $(id).replaceChildren();
    $("agent-filter").innerHTML = '<option value="">All agents</option>';
    $("source-filter").innerHTML = '<option value="">All sources</option>';
    $("search").value = "";
    $("connection").textContent = "Workspace locked";
    $("connection").classList.remove("online");
    $("updated").textContent = "Unlock the workspace to load leads.";
  }
}

function renderAnalytics(data) {
  const s = data.summary;
  const closed = s.won_leads + s.lost_leads;
  const rate = closed ? `${Math.round(s.won_leads / closed * 100)}% of closed leads won` : "No closed leads yet";
  $("kpis").innerHTML = [
    ["Follow-ups due", s.follow_ups, "Open leads requiring attention", ""],
    ["Open leads", s.open_leads, `${s.total_leads} leads in your workspace`, ""],
    ["Active pipeline", compactMoney(s.pipeline_value), "Estimated open property value", ""],
    ["Closed won", compactMoney(s.won_value), `${s.won_leads} won · ${rate}`, ""],
  ].map(([label, value, sub, color]) => `<div class="card"><div class="kpi-label">${label}</div><div class="kpi-value ${color}">${esc(value)}</div><div class="kpi-sub">${esc(sub)}</div></div>`).join("");
  const max = Math.max(1, ...data.stages.map((s) => s.count));
  $("stages").innerHTML = STAGES.map((stage) => {
    const count = data.stages.find((s) => s.stage === stage)?.count || 0;
    return `<div class="bar-row"><span class="bar-label">${stage}</span><div class="bar-track"><div class="bar-fill" style="width:${count / max * 100}%"></div></div><span class="bar-number">${count}</span></div>`;
  }).join("");
  $("agents").innerHTML = data.agents.length ? data.agents.map((a) => {
    const rate = a.won + a.lost ? `${Math.round(a.won / (a.won + a.lost) * 100)}% close rate` : "No closed leads";
    return `<div class="agent-row"><div class="agent-person"><div><strong>${esc(a.agent)}</strong><small>${a.count} ${a.count === 1 ? "lead" : "leads"} · ${a.won} won</small></div></div><div class="agent-value green">${compactMoney(a.won_value)}<small>${rate}</small></div></div>`;
  }).join("") : '<p class="subtitle">No agents yet. Create your first lead.</p>';
  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));
  $("sources").innerHTML = data.sources.length ? data.sources.map((s) => `<div class="bar-row"><span class="bar-label">${esc(s.source)}</span><div class="bar-track"><div class="bar-fill" style="width:${s.count / maxSource * 100}%"></div></div><span class="bar-number">${s.count}</span></div>`).join("") : '<p class="subtitle">Source insights appear when leads are added.</p>';
  $("followup-summary").textContent = s.follow_ups ? `${s.follow_ups} open ${s.follow_ups === 1 ? "lead needs" : "leads need"} your attention.` : "You’re all caught up. No open leads need a follow-up.";
}

function renderMetadata(meta) {
  for (const [id, items, label, datalist] of [["agent-filter", meta.agents, "All agents", "agent-options"], ["source-filter", meta.sources, "All sources", "source-options"]]) {
    const selected = $(id).value;
    const choices = [...new Set([...items, ...(selected ? [selected] : [])])];
    $(id).innerHTML = `<option value="">${label}</option>` + choices.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
    $(id).value = selected;
    $(datalist).innerHTML = items.map((v) => `<option value="${esc(v)}"></option>`).join("");
  }
}

function followupLabel(lead) {
  if (lead.outcome !== "Open") return "—";
  if (lead.follow_up_needed) return "Flagged";
  if (!lead.last_contact_date) return "Never contacted";
  const days = Math.round((new Date(localDate()+"T00:00:00Z") - new Date(lead.last_contact_date+"T00:00:00Z")) / 86400000);
  return days >= 7 ? `${days} days since contact` : "Up to date";
}

function renderRows(page) {
  state.offset = page.offset;
  state.total = page.total;
  $("lead-count").textContent = `${page.total} matching ${page.total === 1 ? "lead" : "leads"}`;
  $("lead-rows").innerHTML = page.items.length ? page.items.map((l) => {
    const badge = l.stage === "Closed Won" ? "won" : l.stage === "Closed Lost" ? "lost" : l.stage === "Negotiating" ? "negotiating" : "";
    const contacts = [
      l.email ? `<a class="contact-line" href="mailto:${encodeURIComponent(l.email)}">${esc(l.email)}</a>` : "",
      l.phone ? `<a class="contact-line" href="tel:${encodeURIComponent(l.phone)}">${esc(l.phone)}</a>` : "",
    ].filter(Boolean).join("") || '<span class="subtitle">No contact added</span>';
    return `<tr><td data-label="Lead"><button class="name-button" data-lead="${l.lead_id}">${esc(l.first_name)} ${esc(l.last_name)}</button><small>${esc(l.lead_source || "No source")}</small></td><td data-label="Stage"><span class="badge ${badge}">${esc(l.stage)}</span></td><td data-label="Contact">${contacts}</td><td data-label="Interest">${esc(l.property_interest || "—")}</td><td data-label="Value">${l.estimated_deal_value === null ? "—" : money(l.estimated_deal_value)}</td><td data-label="Agent">${esc(l.assigned_agent || "Unassigned")}</td><td data-label="Last contact">${dateLabel(l.last_contact_date)}</td><td data-label="Follow-up" class="due-reason">${esc(followupLabel(l))}</td></tr>`;
  }).join("") : '<tr><td colspan="8" class="empty">No leads match this view. Clear filters to broaden the list.</td></tr>';
  $("page-info").textContent = page.total ? `${page.offset + 1}–${Math.min(page.offset + page.items.length, page.total)} of ${page.total}` : "0 leads";
  $("previous").disabled = !state.offset;
  $("next").disabled = state.offset + state.limit >= page.total;
}

async function loadLeads() {
  if (!state.ready || (!state.publicDemo && !state.key)) return;
  const request = ++state.request;
  state.controller?.abort();
  state.controller = new AbortController();
  const params = new URLSearchParams({limit: state.limit, offset: state.offset, sort: $("sort").value});
  for (const [key, id] of [["q", "search"], ["stage", "stage-filter"], ["agent", "agent-filter"], ["source", "source-filter"]]) if ($(id).value) params.set(key, $(id).value);
  if (state.view !== "leads") params.set("follow_up", "true");
  $("lead-rows").classList.add("loading");
  $("lead-rows").setAttribute("aria-busy", "true");
  $("previous").disabled = $("next").disabled = true;
  try {
    const page = await api(`/leads?${params}`, {signal: AbortSignal.any([state.controller.signal, AbortSignal.timeout(15000)])});
    if (request !== state.request) return;
    if (!page.items.length && page.total && state.offset) {
      state.offset = Math.floor((page.total - 1) / state.limit) * state.limit;
      return loadLeads();
    }
    renderRows(page);
    showError("");
  } catch (error) {
    if (request === state.request && error.name !== "AbortError") {
      $("lead-rows").innerHTML = '<tr><td colspan="8" class="empty">Leads could not be loaded. Check access and refresh to retry.</td></tr>';
      $("page-info").textContent = "Unavailable";
      $("previous").disabled = $("next").disabled = true;
      throw error;
    }
  } finally {
    if (request === state.request) { $("lead-rows").classList.remove("loading"); $("lead-rows").setAttribute("aria-busy", "false"); }
  }
}

async function refresh() {
  if (!state.ready) return start();
  if (!state.publicDemo && !state.key) { $("access-dialog").showModal(); return; }
  const version = ++state.refresh;
  showError("");
  $("refresh").disabled = true;
  $("connection").textContent = "Refreshing…";
  try {
    const [analytics, metadata, config] = await Promise.all([api("/analytics"), api("/metadata"), api("/config")]);
    if (version !== state.refresh) return;
    state.today = config.today;
    $("dashboard").hidden = false;
    renderAnalytics(analytics);
    renderMetadata(metadata);
    state.loaded = true;
    await loadLeads();
    if (version !== state.refresh) return;
    $("connection").textContent = "Database connected";
    $("connection").classList.add("online");
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})} · All pipeline metrics reflect the full workspace.`;
  } catch (error) {
    if (version !== state.refresh) { showError(error.message); return; }
    showError(error.message);
    $("connection").textContent = "Connection needs attention";
    $("connection").classList.remove("online");
    $("updated").textContent = "Refresh failed · previously loaded data may be out of date.";
    if (!state.loaded) {
      $("kpis").innerHTML = '<div class="card">Pipeline metrics are unavailable.</div>';
      $("followup-summary").textContent = "Refresh to load follow-ups.";
      $("lead-rows").innerHTML = '<tr><td colspan="8" class="empty">Unable to load leads. Refresh to try again.</td></tr>';
      $("page-info").textContent = "Unavailable";
      $("updated").textContent = "Unable to load workspace data.";
    }
  } finally { if (version === state.refresh) $("refresh").disabled = false; }
}

function switchView(view) {
  state.view = view;
  state.offset = 0;
  clearTimeout(searchTimer);
  $("search").value = $("stage-filter").value = $("agent-filter").value = $("source-filter").value = "";
  $("sort").value = view === "leads" ? "newest" : "contact";
  const titles = {overview: ["Overview", "Start with the people who need your attention."], leads: ["Leads", "Find a lead, review the details, and keep the relationship moving."], followup: ["Follow-ups", "Flagged, never contacted, or at least 7 days since contact."]};
  $("view-title").textContent = titles[view][0];
  $("view-subtitle").textContent = titles[view][1];
  $("table-heading").textContent = view === "leads" ? "Lead directory" : "Follow-up list";
  $("overview-intro").hidden = $("kpis").hidden = view !== "overview";
  $("overview-charts").hidden = $("overview-secondary").hidden = view !== "overview";
  document.querySelectorAll(".nav [data-view]").forEach((button) => { button.classList.toggle("active", button.dataset.view === view); if (button.dataset.view === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  loadLeads().catch((e) => showError(e.message));
}

async function openLead(id = null) {
  if (state.saving) return;
  const version = state.refresh;
  try {
    const lead = id ? await api(`/leads/${id}`) : null;
    if (version !== state.refresh || (!state.publicDemo && !state.key)) return;
    state.editing = lead;
    $("lead-form").reset();
    $("form-error").textContent = "";
    const fields = $("lead-form").elements;
    for (const element of fields) {
      if (!element.name) continue;
      element.disabled = !state.key;
      if (element.type === "checkbox") element.checked = Boolean(lead?.[element.name]);
      else element.value = lead?.[element.name] ?? (element.name === "stage" ? "New Lead" : element.name === "created_date" ? localDate() : "");
    }
    fields.created_date.max = fields.last_contact_date.max = localDate();
    $("dialog-title").textContent = lead ? `${state.key ? "Edit" : "View"} lead` : "New lead";
    $("lead-meta").textContent = lead ? `Created ${dateLabel(lead.created_date)} · ${lead.outcome === "Open" ? "Open opportunity" : lead.outcome === "Won" ? "Closed won" : "Closed lost"}` : "* Required fields.";
    $("delete-lead").hidden = !lead || !state.key;
    $("save-lead").hidden = !state.key;
    $("lead-dialog").showModal();
    fields.first_name.focus();
  } catch (error) { showError(error.message); }
}

$("lead-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.saving || !state.key) return;
  $("form-error").textContent = "";
  const values = {};
  for (const element of $("lead-form").elements) {
    if (!element.name) continue;
    values[element.name] = element.type === "checkbox" ? element.checked : element.value.trim() || null;
  }
  // Send only changed fields for PATCH, preserving unrelated concurrent edits.
  const payload = state.editing ? Object.fromEntries(Object.entries(values).filter(([key, value]) => String(value ?? "") !== String(state.editing[key] ?? ""))) : values;
  if (!Object.keys(payload).length) { $("lead-dialog").close(); return; }
  const editing = state.editing;
  setSaving(true);
  try {
    await api(editing ? `/leads/${editing.lead_id}` : "/leads", {method: editing ? "PATCH" : "POST", body: JSON.stringify(payload)});
    $("lead-dialog").close();
    toast(editing ? "Lead updated." : "Lead created.");
    await refresh();
  } catch (error) { $("form-error").textContent = error.message; }
  finally { setSaving(false); }
});

function setSaving(saving) {
  state.saving = saving;
  for (const id of ["lead-dialog", "delete-dialog"]) {
    $(id).querySelectorAll("button").forEach((button) => button.disabled = saving);
  }
  $("access-button").disabled = saving;
  $("save-lead").textContent = saving ? "Saving…" : "Save lead";
  accessState();
}

for (const id of ["lead-dialog", "delete-dialog"]) $(id).addEventListener("cancel", (event) => {
  if (state.saving) event.preventDefault();
});

$("delete-lead").addEventListener("click", () => {
  $("delete-description").textContent = `${state.editing.first_name} ${state.editing.last_name} will be removed from your pipeline.`;
  $("delete-error").textContent = "";
  $("delete-dialog").showModal();
});
$("confirm-delete").addEventListener("click", async () => {
  if (state.saving || !state.key || !state.editing) return;
  const leadId = state.editing.lead_id;
  setSaving(true);
  try {
    await api(`/leads/${leadId}`, {method: "DELETE"});
    $("delete-dialog").close(); $("lead-dialog").close();
    toast("Lead deleted."); await refresh();
  } catch (error) { $("delete-error").textContent = error.message; }
  finally { setSaving(false); }
});

$("access-button").addEventListener("click", () => {
  if (state.key) {
    lockWorkspace();
    toast("Workspace locked.");
  } else { $("access-error").textContent = ""; $("access-key").value = ""; $("access-dialog").showModal(); }
});
$("access-form").addEventListener("submit", async (event) => {
  event.preventDefault(); $("unlock").disabled = true;
  const key = $("access-key").value;
  try {
    await api("/session", {headers: {Authorization: `Bearer ${key}`}});
    if (!$("access-dialog").open) return;
    state.key = key; $("access-key").value = "";
    $("access-dialog").close(); accessState();
    $("dashboard").hidden = false;
    await refresh();
  } catch (error) { $("access-error").textContent = error.message; }
  finally { $("unlock").disabled = false; }
});

document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => $(b.dataset.close).close()));
document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => switchView(b.dataset.view)));
$("lead-rows").addEventListener("click", (event) => { const b = event.target.closest("[data-lead]"); if (b) openLead(Number(b.dataset.lead)); });
$("new-lead").addEventListener("click", () => openLead());
$("refresh").addEventListener("click", refresh);
$("previous").addEventListener("click", () => { state.offset = Math.max(0, state.offset - state.limit); loadLeads().catch((e) => showError(e.message)); });
$("next").addEventListener("click", () => { state.offset += state.limit; loadLeads().catch((e) => showError(e.message)); });
$("filters").addEventListener("submit", (event) => event.preventDefault());
$("clear-filters").addEventListener("click", () => switchView(state.view));
let searchTimer;
$("search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.offset = 0; loadLeads().catch((e) => showError(e.message)); }, 250); });
for (const id of ["stage-filter", "agent-filter", "source-filter", "sort"]) $(id).addEventListener("change", () => { state.offset = 0; loadLeads().catch((e) => showError(e.message)); });
$("stage-filter").innerHTML += STAGES.map((s) => `<option>${s}</option>`).join("");
$("form-stage").innerHTML = STAGES.map((s) => `<option>${s}</option>`).join("");
$("today").textContent = new Date().toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric", year: "numeric"});

async function start() {
  $("refresh").disabled = true;
  showError("");
  try {
    const config = await api("/config");
    state.ready = true;
    state.publicDemo = config.public_demo;
    state.today = config.today;
    accessState();
    $("demo-notice").hidden = !state.publicDemo;
    if (!state.publicDemo && !state.key) {
      $("dashboard").hidden = true;
      $("connection").textContent = "Workspace locked";
      $("access-button").textContent = "Unlock workspace";
      $("access-dialog").showModal();
    } else await refresh();
  } catch (error) { state.ready = false; showError(error.message); $("dashboard").hidden = true; $("connection").textContent = "API unavailable"; }
  finally { $("refresh").disabled = false; }
}
start();
