// Leave blank when FastAPI serves the frontend. For a separate static host,
// set this to the deployed HTTPS API origin (never put an access key here).
window.CRM_API_BASE = "";

// The historical Pages address forwards to the connected application.
if (location.hostname === "jimdous.github.io" && location.pathname.startsWith("/crm-pipeline-project/")) {
  location.replace("https://crm-pipeline-v2.onrender.com/");
}
