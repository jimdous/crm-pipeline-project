"use strict";

const $ = (id) => document.getElementById(id);
const STAGES = ["New Lead", "Contacted", "Qualified", "Showing Scheduled", "Negotiating", "Closed Won", "Closed Lost"];
const COLORS = ["#6384b0", "#639fff", "#57dcaf", "#55d1dc", "#ffc46c", "#b395ff", "#ff9191"];
const base = (window.CRM_API_BASE || "").replace(/\/$/, "");
const state = {key: "", view: "overview", offset: 0, total: 0, limit: 10, rows: [], editing: null, publicDemo: false, request: 0, controller: null};
const money = (value) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", maximumFractionDigits: 0}).format(Number(value || 0));
const compactMoney = (value) => new Intl.NumberFormat("en-US", {style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2}).format(Number(value || 0));
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"}) : "Never contacted";

async function api(path, options = {}) {
  const headers = { ...(options.body ? {"Content-Type": "application/json"} : {}), ...(state.key ? {Authorization: `Bearer ${state.key}`} : {}), ...options.headers };
  let response;
  try {
    response = await fetch(base + path, {...options, headers, signal: options.signal || AbortSignal.timeout(15000)});
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot reach the API. Check that the backend is running, then refresh.");
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
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
  $("new-lead").disabled = !state.key;
  $("access-button").textContent = state.key ? "Lock workspace" : "Unlock editing";
}

function renderAnalytics(data) {
  const s = data.summary;
  const closed = s.won_leads + s.lost_leads;
  const rate = closed ? `${Math.round(s.won_leads / closed * 100)}% of closed leads won` : "No closed leads yet";
  $("kpis").innerHTML = [
    ["Total leads", s.total_leads, `${s.open_leads} active opportunities`, "blue"],
    ["Active pipeline", compactMoney(s.pipeline_value), "Estimated open property value", "green"],
    ["Closed won value", compactMoney(s.won_value), rate, "blue"],
    ["Follow-ups due", s.follow_ups, "Flagged, uncontacted, or stale", "amber"],
  ].map(([label, value, sub, color]) => `<div class="card"><div class="kpi-label">${label}</div><div class="kpi-value ${color}">${esc(value)}</div><div class="kpi-sub">${esc(sub)}</div></div>`).join("");
  const max = Math.max(1, ...data.stages.map((s) => s.count));
  $("stages").innerHTML = STAGES.map((stage, i) => {
    const count = data.stages.find((s) => s.stage === stage)?.count || 0;
    return `<div class="bar-row"><span class="bar-label">${stage}</span><div class="bar-track"><div class="bar-fill" style="width:${count / max * 100}%;background:${COLORS[i]}"></div></div><span class="bar-number">${count}</span></div>`;
  }).join("");
  $("agents").innerHTML = data.agents.length ? data.agents.map((a) => {
    const initials = a.agent.split(/\s+/).map((x) => x[0]).slice(0,2).join("");
    const rate = a.won + a.lost ? `${Math.round(a.won / (a.won + a.lost) * 100)}% close rate` : "No closed leads";
    return `<div class="agent-row"><div class="agent-person"><div class="avatar">${esc(initials)}</div><div><strong>${esc(a.agent)}</strong><small>${a.count} leads · ${a.won} won</small></div></div><div class="agent-value green">${compactMoney(a.won_value)}<small>${rate}</small></div></div>`;
  }).join("") : '<p class="subtitle">No agents yet. Create your first lead.</p>';
  const maxSource = Math.max(1, ...data.sources.map((s) => s.count));
  $("sources").innerHTML = data.sources.length ? data.sources.map((s) => `<div class="bar-row"><span class="bar-label">${esc(s.source)}</span><div class="bar-track"><div class="bar-fill" style="width:${s.count / maxSource * 100}%;background:var(--green)"></div></div><span class="bar-number">${s.count}</span></div>`).join("") : '<p class="subtitle">Source insights appear when leads are added.</p>';
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
  if (!lead.last_contact_date) return "Not contacted";
  const days = Math.round((new Date(localDate()+"T00:00:00Z") - new Date(lead.last_contact_date+"T00:00:00Z")) / 86400000);
  return days >= 7 ? `${days} days ago` : "Up to date";
}

function renderRows(page) {
  state.rows = page.items;
  state.total = page.total;
  $("lead-count").textContent = `${page.total} matching ${page.total === 1 ? "lead" : "leads"}`;
  $("lead-rows").innerHTML = page.items.length ? page.items.map((l) => {
    const badge = l.stage === "Closed Won" ? "won" : l.stage === "Closed Lost" ? "lost" : l.stage === "Negotiating" ? "negotiating" : "";
    return `<tr><td><button class="name-button" data-lead="${l.lead_id}">${esc(l.first_name)} ${esc(l.last_name)}</button><small>${esc(l.email || l.property_interest || "No email added")}</small></td><td><span class="badge ${badge}">${esc(l.stage || "Unspecified")}</span></td><td>${l.estimated_deal_value === null ? "—" : money(l.estimated_deal_value)}</td><td>${esc(l.lead_source || "Unknown")}</td><td>${esc(l.assigned_agent || "Unassigned")}</td><td>${dateLabel(l.last_contact_date)}</td><td>${esc(followupLabel(l))}</td></tr>`;
  }).join("") : '<tr><td colspan="7" class="empty">No leads match this view. Try clearing your filters or create a new lead.</td></tr>';
  $("page-info").textContent = page.total ? `${page.offset + 1}–${Math.min(page.offset + page.items.length, page.total)} of ${page.total}` : "0 leads";
  $("previous").disabled = !state.offset;
  $("next").disabled = state.offset + state.limit >= page.total;
}

async function loadLeads() {
  const request = ++state.request;
  state.controller?.abort();
  state.controller = new AbortController();
  const params = new URLSearchParams({limit: state.limit, offset: state.offset, sort: $("sort").value});
  for (const [key, id] of [["q", "search"], ["stage", "stage-filter"], ["agent", "agent-filter"], ["source", "source-filter"]]) if ($(id).value) params.set(key, $(id).value);
  if (state.view === "followup") params.set("follow_up", "true");
  $("lead-rows").classList.add("loading");
  $("lead-rows").setAttribute("aria-busy", "true");
  try {
    const page = await api(`/leads?${params}`, {signal: AbortSignal.any([state.controller.signal, AbortSignal.timeout(15000)])});
    if (request !== state.request) return;
    if (!page.items.length && page.total && state.offset) {
      state.offset = Math.floor((page.total - 1) / state.limit) * state.limit;
      return loadLeads();
    }
    renderRows(page);
  } catch (error) {
    if (request === state.request && error.name !== "AbortError") {
      $("lead-rows").innerHTML = '<tr><td colspan="7" class="empty">Leads could not be loaded. Check access and refresh to retry.</td></tr>';
      $("page-info").textContent = "Unavailable";
      $("previous").disabled = $("next").disabled = true;
      throw error;
    }
  } finally {
    if (request === state.request) { $("lead-rows").classList.remove("loading"); $("lead-rows").setAttribute("aria-busy", "false"); }
  }
}

async function refresh() {
  showError("");
  $("refresh").disabled = true;
  $("connection").textContent = "Refreshing…";
  try {
    const [analytics, metadata] = await Promise.all([api("/analytics"), api("/metadata")]);
    renderAnalytics(analytics);
    renderMetadata(metadata);
    await loadLeads();
    $("connection").textContent = "Database connected";
    $("connection").classList.add("online");
    $("updated").textContent = `Updated ${new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})} · Metrics cover all leads; filters apply to the directory.`;
  } catch (error) {
    showError(error.message);
    $("connection").textContent = "Connection needs attention";
    $("connection").classList.remove("online");
    $("updated").textContent = "Refresh failed · previously loaded data may be out of date.";
  } finally { $("refresh").disabled = false; }
}

function switchView(view) {
  state.view = view;
  state.offset = 0;
  $("search").value = $("stage-filter").value = $("agent-filter").value = $("source-filter").value = "";
  $("sort").value = view === "followup" ? "contact" : "newest";
  const titles = {overview: ["Pipeline overview", "A clear view of your leads, opportunities, and next steps."], leads: ["Your lead directory", "Every relationship in one place. Find a lead and keep it moving."], followup: ["Who needs a follow-up?", "Open leads that are flagged, never contacted, or quiet for at least 7 days."]};
  $("view-title").textContent = titles[view][0];
  $("view-subtitle").textContent = titles[view][1];
  $("table-heading").textContent = view === "followup" ? "Follow-up queue" : "Lead directory";
  $("overview-charts").hidden = $("overview-secondary").hidden = view !== "overview";
  document.querySelectorAll(".nav [data-view]").forEach((button) => { button.classList.toggle("active", button.dataset.view === view); if (button.dataset.view === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current"); });
  loadLeads().catch((e) => showError(e.message));
}

async function openLead(id = null) {
  try {
    const lead = id ? await api(`/leads/${id}`) : null;
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
    $("lead-meta").textContent = lead ? `Lead #${lead.lead_id} · Outcome: ${lead.outcome || "Unspecified"}. Outcome follows stage automatically.` : "Outcome follows stage automatically. * Required fields.";
    $("delete-lead").hidden = !lead || !state.key;
    $("save-lead").hidden = !state.key;
    $("lead-dialog").showModal();
  } catch (error) { showError(error.message); }
}

$("lead-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("form-error").textContent = "";
  const values = {};
  for (const element of $("lead-form").elements) {
    if (!element.name) continue;
    values[element.name] = element.type === "checkbox" ? element.checked : element.value.trim() || null;
  }
  // Send only changed fields for PATCH, preserving unrelated concurrent edits.
  const payload = state.editing ? Object.fromEntries(Object.entries(values).filter(([key, value]) => String(value ?? "") !== String(state.editing[key] ?? ""))) : values;
  if (!Object.keys(payload).length) { $("lead-dialog").close(); return; }
  $("save-lead").disabled = true;
  $("delete-lead").disabled = true;
  try {
    await api(state.editing ? `/leads/${state.editing.lead_id}` : "/leads", {method: state.editing ? "PATCH" : "POST", body: JSON.stringify(payload)});
    $("lead-dialog").close();
    toast(state.editing ? "Lead updated and saved to PostgreSQL." : "Lead created and saved to PostgreSQL.");
    await refresh();
  } catch (error) { $("form-error").textContent = error.message; }
  finally { $("save-lead").disabled = $("delete-lead").disabled = false; }
});

$("delete-lead").addEventListener("click", () => {
  $("delete-description").textContent = `${state.editing.first_name} ${state.editing.last_name} will be removed from your pipeline.`;
  $("delete-error").textContent = "";
  $("delete-dialog").showModal();
});
$("confirm-delete").addEventListener("click", async () => {
  $("confirm-delete").disabled = true;
  try {
    await api(`/leads/${state.editing.lead_id}`, {method: "DELETE"});
    $("delete-dialog").close(); $("lead-dialog").close();
    toast("Lead deleted."); await refresh();
  } catch (error) { $("delete-error").textContent = error.message; }
  finally { $("confirm-delete").disabled = false; }
});

$("access-button").addEventListener("click", () => {
  if (state.key) {
    state.key = ""; accessState();
    if (!state.publicDemo) {
      state.controller?.abort(); state.request++;
      state.rows = []; state.editing = null;
      $("dashboard").hidden = true;
      $("lead-rows").replaceChildren();
      $("kpis").replaceChildren();
      $("agents").replaceChildren();
      $("sources").replaceChildren();
      $("connection").textContent = "Workspace locked";
      $("connection").classList.remove("online");
    }
    toast("Workspace locked.");
  } else { $("access-error").textContent = ""; $("access-key").value = ""; $("access-dialog").showModal(); }
});
$("access-form").addEventListener("submit", async (event) => {
  event.preventDefault(); $("unlock").disabled = true;
  const key = $("access-key").value;
  try {
    await api("/session", {headers: {Authorization: `Bearer ${key}`}});
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
let searchTimer;
$("search").addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.offset = 0; loadLeads().catch((e) => showError(e.message)); }, 250); });
for (const id of ["stage-filter", "agent-filter", "source-filter", "sort"]) $(id).addEventListener("change", () => { state.offset = 0; loadLeads().catch((e) => showError(e.message)); });
$("stage-filter").innerHTML += STAGES.map((s) => `<option>${s}</option>`).join("");
$("form-stage").innerHTML = STAGES.map((s) => `<option>${s}</option>`).join("");
$("today").textContent = new Date().toLocaleDateString("en-US", {weekday: "long", month: "long", day: "numeric", year: "numeric"});
$("api-docs").href = base + "/docs";

async function start() {
  try {
    const config = await api("/config");
    state.publicDemo = config.public_demo;
    $("demo-notice").hidden = !state.publicDemo;
    if (!state.publicDemo) {
      $("dashboard").hidden = true;
      $("connection").textContent = "Workspace locked";
      $("access-button").textContent = "Unlock workspace";
      $("access-dialog").showModal();
    } else await refresh();
  } catch (error) { showError(error.message); $("dashboard").hidden = true; $("connection").textContent = "API unavailable"; }
}
start();
