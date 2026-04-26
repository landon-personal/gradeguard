import { useState } from "react";
import { Download, Chrome, BookOpen, CheckCircle2, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import JSZip from "jszip";

const API_URL = "https://699c87ae1b851d45eece445d.base44.app/api/apps/699c87ae1b851d45eece445d/functions/extensionApi";

const ICON_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/699c87ae1b851d45eece445d/ad711b049_f886201a2_Screenshot2026-02-25102247AM.png";

const MANIFEST = JSON.stringify({
  manifest_version: 3,
  name: "GradeGuard",
  version: "1.0",
  description: "View your AI study plan and manage assignments & tests from any tab.",
  permissions: ["storage"],
  host_permissions: ["https://699c87ae1b851d45eece445d.base44.app/*"],
  icons: {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  },
  action: {
    default_popup: "popup.html",
    default_title: "GradeGuard",
    default_icon: {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  }
}, null, 2);

const POPUP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>GradeGuard</title>
  <link rel="stylesheet" href="popup.css" />
</head>
<body>
  <div id="app">
    <!-- Login Screen -->
    <div id="login-screen">
      <div class="login-card">
        <div class="header">
          <div class="logo-wrap"><img src="${ICON_URL}" style="width:38px;height:38px;border-radius:10px;object-fit:cover;" /></div>
          <h1>GradeGuard</h1>
          <p class="subtitle">Sign in with your GradeGuard email</p>
        </div>
        <div class="form-group">
          <label>Email address</label>
          <input type="email" id="email-input" placeholder="your@school.edu" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password-input" placeholder="••••••••" />
        </div>
        <button class="btn-primary" id="login-btn">Sign In</button>
        <p class="error-msg" id="login-error" style="margin-top:8px"></p>
      </div>
    </div>

    <!-- Main Screen -->
    <div id="main-screen" class="hidden">
      <div class="top-bar">
        <div class="user-info">
          <div class="logo-sm"><img src="${ICON_URL}" style="width:22px;height:22px;border-radius:6px;object-fit:cover;" /></div>
          <span class="user-name-text" id="user-name">Student</span>
        </div>
        <button id="logout-btn" class="logout-btn">Sign out</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab active" data-tab="plan">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          Plan
        </button>
        <button class="tab" data-tab="assignments">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Tasks
        </button>
        <button class="tab" data-tab="tests">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4m6-6h10m0 0h4a2 2 0 0 1 2 2v4m0 0H5"/></svg>
          Tests
        </button>
        <button class="tab" data-tab="add">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Add
        </button>
      </div>

      <!-- AI Plan Tab -->
      <div id="tab-plan" class="tab-content">
        <div class="section-header">
          <span>✨ Today's AI Study Plan</span>
          <button id="refresh-plan-btn" class="icon-btn" title="Refresh">↻</button>
        </div>
        <div id="plan-loading" class="loading">Generating your plan...</div>
        <div id="plan-list"></div>
        <p id="plan-tip" class="tip"></p>
      </div>

      <!-- Assignments Tab -->
      <div id="tab-assignments" class="tab-content hidden">
        <div id="assignments-loading" class="loading">Loading...</div>
        <div id="assignments-list"></div>
      </div>

      <!-- Tests Tab -->
      <div id="tab-tests" class="tab-content hidden">
        <div id="tests-loading" class="loading">Loading...</div>
        <div id="tests-list"></div>
      </div>

      <!-- Add Tab -->
      <div id="tab-add" class="tab-content hidden">
        <div class="add-toggle">
          <button class="add-type-btn active" data-type="assignment">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Assignment
          </button>
          <button class="add-type-btn" data-type="test">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 0-2 2v4m6-6h10m0 0h4a2 2 0 0 1 2 2v4m0 0H5"/></svg>
            Test
          </button>
        </div>

        <!-- Add Assignment Form -->
        <div id="add-assignment-form">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" id="a-name" placeholder="e.g. Chapter 5 Essay" />
          </div>
          <div class="form-group">
            <label>Subject *</label>
            <input type="text" id="a-subject" placeholder="e.g. English" />
          </div>
          <div class="form-group">
            <label>Due Date *</label>
            <input type="date" id="a-due" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Difficulty</label>
              <select id="a-difficulty">
                <option value="easy">Easy</option>
                <option value="medium" selected>Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label>Weight</label>
              <select id="a-weight">
                <option value="prepare">Prepare (20%)</option>
                <option value="rehearse">Rehearse (30%)</option>
                <option value="perform">Perform (50%)</option>
                <option value="unknown" selected>Unknown</option>
              </select>
            </div>
          </div>
          <button class="btn-primary" id="save-assignment-btn">Add Assignment</button>
          <p class="success-msg hidden" id="a-success">✅ Assignment added!</p>
          <p class="error-msg" id="a-error"></p>
        </div>

        <!-- Add Test Form -->
        <div id="add-test-form" class="hidden">
          <div class="form-group">
            <label>Test Name *</label>
            <input type="text" id="t-name" placeholder="e.g. Chapter 5 Quiz" />
          </div>
          <div class="form-group">
            <label>Subject *</label>
            <input type="text" id="t-subject" placeholder="e.g. Biology" />
          </div>
          <div class="form-group">
            <label>Test Date *</label>
            <input type="date" id="t-date" />
          </div>
          <div class="form-group">
            <label>Topics</label>
            <input type="text" id="t-topics" placeholder="e.g. Cell division, mitosis" />
          </div>
          <div class="form-group">
            <label>Difficulty</label>
            <select id="t-difficulty">
              <option value="easy">Easy</option>
              <option value="medium" selected>Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <button class="btn-primary" id="save-test-btn">Add Test</button>
          <p class="success-msg hidden" id="t-success">✅ Test added!</p>
          <p class="error-msg" id="t-error"></p>
        </div>
      </div>
    </div>
  </div>
  <script src="popup.js"></script>
</body>
</html>`;

const POPUP_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  width: 380px;
  min-height: 540px;
  max-height: 640px;
  background: linear-gradient(135deg, #e8eaf6 0%, #ede7f6 35%, #e3f2fd 65%, #f3e5f5 100%);
  background-size: 300% 300%;
  animation: gradientShift 10s ease infinite;
  color: #1e1b4b;
  font-size: 13px;
  overflow: hidden;
}

#app { min-height: 540px; display: flex; flex-direction: column; position: relative; }

/* Ambient blobs */
#app::before {
  content: '';
  position: fixed; top: -40px; left: -40px;
  width: 180px; height: 180px;
  background: radial-gradient(circle, rgba(129,140,248,0.45) 0%, transparent 70%);
  filter: blur(30px); pointer-events: none; z-index: 0;
}
#app::after {
  content: '';
  position: fixed; bottom: 20px; right: -30px;
  width: 150px; height: 150px;
  background: radial-gradient(circle, rgba(167,139,250,0.35) 0%, transparent 70%);
  filter: blur(25px); pointer-events: none; z-index: 0;
}

/* Login */
#login-screen {
  min-height: 540px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 28px 24px;
  position: relative; z-index: 1;
}
.login-card {
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.9);
  border-radius: 24px;
  padding: 32px 28px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.06);
  animation: fadeIn 0.3s ease;
}
.header { text-align: center; margin-bottom: 24px; }
.logo-wrap {
  width: 60px; height: 60px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 18px;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  font-size: 30px;
  box-shadow: 0 8px 28px rgba(79,70,229,0.4);
}
h1 { font-size: 21px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
.subtitle { color: #6b7280; font-size: 12px; margin-top: 5px; }
.form-group { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
label { font-size: 11px; font-weight: 700; color: #4b5563; text-transform: uppercase; letter-spacing: 0.6px; }
input, select {
  border: 1.5px solid rgba(209,213,219,0.8);
  border-radius: 12px;
  padding: 10px 13px;
  font-size: 13px;
  background: rgba(249,250,251,0.8);
  color: #1f2937;
  width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
input:focus, select:focus {
  outline: none;
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129,140,248,0.2);
  background: white;
}

/* Header bar */
.top-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 16px;
  background: rgba(255,255,255,0.55);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255,255,255,0.6);
  position: relative; z-index: 10;
}
.user-info { display: flex; align-items: center; gap: 8px; }
.logo-sm {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  box-shadow: 0 3px 10px rgba(79,70,229,0.35);
}
.user-name-text { font-weight: 700; font-size: 13px; color: #1e1b4b; }
.logout-btn {
  font-size: 11px; color: #6b7280;
  background: rgba(243,244,246,0.8);
  border: 1px solid rgba(209,213,219,0.6);
  cursor: pointer;
  padding: 5px 11px; border-radius: 9px;
  font-weight: 600; transition: all 0.15s;
}
.logout-btn:hover { background: rgba(238,232,255,0.9); color: #4f46e5; border-color: rgba(129,140,248,0.4); }

/* Tabs */
.tabs {
  display: flex;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(209,213,219,0.4);
  padding: 0 4px;
  position: relative; z-index: 9;
}
.tab {
  flex: 1; padding: 10px 2px 8px;
  border: none; border-bottom: 2.5px solid transparent;
  background: none; cursor: pointer;
  font-size: 11px; font-weight: 600; color: #9ca3af;
  transition: all 0.18s; white-space: nowrap;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.tab.active { color: #4f46e5; border-bottom-color: #4f46e5; }
.tab:hover:not(.active) { color: #6366f1; background: rgba(238,232,255,0.3); border-radius: 8px 8px 0 0; }

/* Tab content */
.tab-content {
  flex: 1; overflow-y: auto; max-height: 460px;
  padding: 14px 13px;
  display: flex; flex-direction: column; gap: 9px;
  position: relative; z-index: 1;
}
.tab-content::-webkit-scrollbar { width: 4px; }
.tab-content::-webkit-scrollbar-track { background: transparent; }
.tab-content::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.3); border-radius: 99px; }
.hidden { display: none !important; }

/* Section header */
.section-header {
  display: flex; align-items: center; justify-content: space-between;
  font-weight: 700; font-size: 11px; color: #6366f1;
  text-transform: uppercase; letter-spacing: 0.7px;
  padding-bottom: 2px;
}
.icon-btn {
  background: none; border: none; cursor: pointer;
  font-size: 16px; color: #9ca3af; padding: 4px 6px; border-radius: 8px;
  transition: all 0.15s;
}
.icon-btn:hover { color: #4f46e5; background: rgba(237,233,254,0.8); }

/* Loading */
.loading {
  text-align: center; color: #9ca3af; font-size: 12px;
  padding: 32px 0; display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.spinner {
  width: 22px; height: 22px;
  border: 2.5px solid rgba(229,231,235,0.8);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Cards (plan, assignment, test) */
.plan-item, .item-card {
  background: rgba(255,255,255,0.82);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 13px 15px;
  margin-bottom: 8px;
  box-shadow: 0 2px 10px rgba(79,70,229,0.08), 0 1px 3px rgba(0,0,0,0.04);
  animation: fadeIn 0.25s ease;
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
  cursor: default;
}
.plan-item:hover, .item-card:hover {
  box-shadow: 0 6px 24px rgba(79,70,229,0.16), 0 2px 8px rgba(0,0,0,0.06);
  transform: translateY(-2px);
  border-color: rgba(129,140,248,0.4);
}

.plan-item-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.plan-name { font-weight: 700; font-size: 13px; color: #111827; line-height: 1.3; }
.urgency { font-size: 10px; padding: 3px 9px; border-radius: 99px; font-weight: 700; flex-shrink: 0; letter-spacing: 0.2px; }
.urgency-high { background: #fee2e2; color: #dc2626; }
.urgency-medium { background: #fef3c7; color: #d97706; }
.urgency-low { background: #d1fae5; color: #059669; }
.plan-subject { font-size: 11px; color: #6b7280; margin-top: 3px; font-weight: 500; }
.plan-time { font-size: 11px; color: #7c3aed; font-weight: 700; margin-top: 6px; }
.plan-reason { font-size: 11px; color: #6b7280; margin-top: 3px; line-height: 1.5; }
.tip {
  font-size: 11px; color: #5b21b6;
  background: rgba(237,233,254,0.7);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 10px 13px;
  font-style: italic;
  border-left: 3px solid #8b5cf6;
  line-height: 1.5;
}

/* Item cards */
.item-name { font-weight: 700; font-size: 13px; color: #111827; }
.item-subject {
  font-size: 11px; color: #6366f1; font-weight: 600;
  background: rgba(238,232,255,0.6); border-radius: 6px;
  padding: 1px 7px; display: inline-block; margin-top: 4px;
}
.item-date { font-size: 11px; color: #9ca3af; margin-top: 5px; }
.item-status-row { display: flex; align-items: center; gap: 6px; margin-top: 10px; }
.status-select {
  font-size: 11px;
  border: 1.5px solid rgba(209,213,219,0.7);
  border-radius: 9px;
  padding: 4px 8px;
  background: rgba(249,250,251,0.8);
  color: #374151;
  cursor: pointer; font-weight: 600;
  transition: border-color 0.15s;
}
.status-select:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 2px rgba(129,140,248,0.15); }

/* Forms */
.form-row { display: flex; gap: 10px; }
.form-row .form-group { flex: 1; }

/* Add type toggle */
.add-toggle { display: flex; gap: 8px; margin-bottom: 12px; }
.add-type-btn {
  flex: 1; padding: 9px;
  border: 1.5px solid rgba(209,213,219,0.6);
  border-radius: 12px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  font-size: 12px; cursor: pointer;
  font-weight: 600; color: #6b7280; transition: all 0.18s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.add-type-btn:hover:not(.active) { background: rgba(238,232,255,0.6); color: #4f46e5; border-color: rgba(129,140,248,0.4); }
.add-type-btn.active {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white; border-color: transparent;
  box-shadow: 0 4px 14px rgba(79,70,229,0.35);
}

/* Buttons */
.btn-primary {
  width: 100%; padding: 11px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white; border: none; border-radius: 12px;
  font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 6px;
  box-shadow: 0 4px 16px rgba(79,70,229,0.35);
  transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
  letter-spacing: 0.1px;
}
.btn-primary:hover { opacity: 0.92; box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
.btn-primary:active { transform: scale(0.98); }
.btn-primary:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }

.error-msg { color: #dc2626; font-size: 11px; text-align: center; min-height: 14px; font-weight: 500; margin-top: 4px; }
.success-msg {
  color: #059669; font-size: 11px; text-align: center; font-weight: 600;
  background: rgba(209,250,229,0.8); border-radius: 10px; padding: 7px;
  border: 1px solid rgba(167,243,208,0.6);
}

/* Empty state */
.empty { text-align: center; color: #9ca3af; font-size: 12px; padding: 36px 0; line-height: 1.7; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
`;

const POPUP_JS = `const API = "${API_URL}";

// Chrome extensions must use chrome.storage.local (localStorage doesn't persist reliably in popups)
// We use a synchronous-looking cache backed by chrome.storage.local
let _emailCache = null;
let _tokenCache = null;

function getEmail() { return _emailCache; }
function setEmail(e) { _emailCache = e; chrome.storage.local.set({ gg_ext_email: e }); }
function getToken() { return _tokenCache; }
function setToken(t) { _tokenCache = t; chrome.storage.local.set({ gg_ext_token: t }); }
function clearAuth() { _emailCache = null; _tokenCache = null; chrome.storage.local.remove(["gg_ext_email", "gg_ext_token"]); }

// HTML-escape to prevent XSS when injecting into innerHTML
function safe(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

async function api(method, action, body) {
  const token = getToken();
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (token) opts.headers["Authorization"] = "Bearer " + token;
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const res = await fetch(API + "?action=" + action, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
  return data;
}

// ---- UI helpers ----
function $ (id) { return document.getElementById(id); }
function show(id) { $(id).classList.remove("hidden"); }
function hide(id) { $(id).classList.add("hidden"); }

function urgencyClass(u) {
  if (u === "High") return "urgency-high";
  if (u === "Medium") return "urgency-medium";
  return "urgency-low";
}

function statusClass(s) {
  if (s === "pending") return "status-pending";
  if (s === "in_progress") return "status-in_progress";
  if (s === "completed") return "status-completed";
  if (s === "upcoming") return "status-upcoming";
  return "status-pending";
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(dateStr + "T00:00:00");
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return \`\${Math.abs(diff)}d overdue\`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return \`Due in \${diff}d\`;
}

// ---- Tabs ----
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    show("tab-" + tab);
    if (tab === "assignments") loadAssignments();
    if (tab === "tests") loadTests();
  });
});

// ---- Add type toggle ----
document.querySelectorAll(".add-type-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".add-type-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.type === "assignment") {
      show("add-assignment-form"); hide("add-test-form");
    } else {
      hide("add-assignment-form"); show("add-test-form");
    }
  });
});

// ---- Login ----
$("login-btn").addEventListener("click", async () => {
  const email = $("email-input").value.trim();
  const password = $("password-input") ? $("password-input").value : "";
  if (!email || !password) { $("login-error").textContent = "Please enter your email and password."; return; }
  $("login-error").textContent = "";
  $("login-btn").textContent = "Signing in...";
  $("login-btn").disabled = true;
  try {
    const loginRes = await fetch(API.replace("/extensionApi", "/authenticateUser"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, action: "login" })
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || loginData.error) throw new Error(loginData.error || "Login failed");
    setEmail(loginData.email);
    setToken(loginData.token);
    showMain();
  } catch(e) {
    clearAuth();
    console.error("Login error:", e);
    $("login-error").textContent = e.message || "Sign in failed";
    $("login-btn").textContent = "Sign In";
    $("login-btn").disabled = false;
  }
});

// ---- Logout ----
$("logout-btn").addEventListener("click", () => {
  clearAuth();
  hide("main-screen"); show("login-screen");
  $("email-input").value = "";
  if ($("password-input")) $("password-input").value = "";
});

// ---- Show main screen ----
async function showMain() {
  hide("login-screen"); show("main-screen");
  $("user-name").textContent = "Loading...";
  loadPlan();
  try {
    const { profile } = await api("GET", "profile");
    if (profile && profile.user_name) {
      $("user-name").textContent = profile.user_name;
    } else {
      const email = getEmail();
      $("user-name").textContent = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Student";
    }
  } catch(e) {
    const email = getEmail();
    $("user-name").textContent = email ? email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Student";
  }
}

// ---- AI Plan ----
async function loadPlan() {
  $("plan-loading").innerHTML = '<div class="spinner"></div><span>Generating your plan...</span>';
  show("plan-loading");
  $("plan-list").innerHTML = "";
  $("plan-tip").textContent = "";
  try {
    const { plan } = await api("GET", "ai_plan");
    hide("plan-loading");
    if (!plan || !plan.items || !plan.items.length) {
      $("plan-list").innerHTML = '<div class="empty"><div class="empty-icon">🎉</div>All caught up!<br>No pending work.</div>';
      return;
    }
    $("plan-list").innerHTML = plan.items.map(item => \`
      <div class="plan-item">
        <div class="plan-item-header">
          <span class="plan-name">\${safe(item.assignment_name)}</span>
          <span class="urgency \${urgencyClass(item.urgency_level)}">\${safe(item.urgency_level)}</span>
        </div>
        <div class="plan-subject">\${safe(item.subject)}</div>
        <div class="plan-time">⏱ \${item.suggested_time_today} min today</div>
        <div class="plan-reason">\${safe(item.priority_reason)}</div>
      </div>
    \`).join("");
    if (plan.daily_tip) $("plan-tip").textContent = "💡 " + plan.daily_tip;
  } catch(e) {
    hide("plan-loading");
    $("plan-list").innerHTML = '<div class="empty">Could not load plan: ' + safe(e.message) + '</div>';
  }
}

$("refresh-plan-btn").addEventListener("click", loadPlan);

// ---- Assignments ----
async function loadAssignments() {
  $("assignments-loading").innerHTML = '<div class="spinner"></div><span>Loading...</span>';
  show("assignments-loading"); $("assignments-list").innerHTML = "";
  try {
    const { assignments } = await api("GET", "assignments");
    hide("assignments-loading");
    if (!assignments.length) {
      $("assignments-list").innerHTML = '<div class="empty"><div class="empty-icon">📚</div>No assignments yet.</div>';
      return;
    }
    const pending = assignments.filter(a => a.status !== "completed");
    const done = assignments.filter(a => a.status === "completed");
    const all = [...pending, ...done];
    $("assignments-list").innerHTML = all.map(a => \`
      <div class="item-card" id="acard-\${safe(a.id)}">
        <div class="item-card-top">
          <div>
            <div class="item-name">\${safe(a.name)}</div>
            <div class="item-subject">\${safe(a.subject || "")}</div>
            <div class="item-date">\${daysUntil(a.due_date)} · \${safe(a.difficulty || "medium")}</div>
          </div>
        </div>
        <div class="item-status-row">
          <select class="status-select" data-id="\${safe(a.id)}" data-type="assignment">
            <option value="pending" \${a.status==="pending"?"selected":""}>Pending</option>
            <option value="in_progress" \${a.status==="in_progress"?"selected":""}>In Progress</option>
            <option value="completed" \${a.status==="completed"?"selected":""}>Completed</option>
          </select>
        </div>
      </div>
    \`).join("");
    attachStatusListeners();
  } catch(e) {
    $("assignments-loading").textContent = "Error: " + (e.message || "unknown");
  }
}

// ---- Tests ----
async function loadTests() {
  $("tests-loading").innerHTML = '<div class="spinner"></div><span>Loading...</span>';
  show("tests-loading"); $("tests-list").innerHTML = "";
  try {
    const { tests } = await api("GET", "tests");
    hide("tests-loading");
    if (!tests.length) {
      $("tests-list").innerHTML = '<div class="empty"><div class="empty-icon">🧪</div>No tests yet.</div>';
      return;
    }
    $("tests-list").innerHTML = tests.map(t => \`
      <div class="item-card" id="tcard-\${safe(t.id)}">
        <div class="item-card-top">
          <div>
            <div class="item-name">\${safe(t.name)}</div>
            <div class="item-subject">\${safe(t.subject)}</div>
            <div class="item-date">\${daysUntil(t.test_date)}\${t.topics ? " · " + safe(t.topics.substring(0, 40)) : ""}</div>
          </div>
        </div>
        <div class="item-status-row">
          <select class="status-select" data-id="\${safe(t.id)}" data-type="test">
            <option value="upcoming" \${t.status==="upcoming"?"selected":""}>Upcoming</option>
            <option value="completed" \${t.status==="completed"?"selected":""}>Completed</option>
          </select>
        </div>
      </div>
    \`).join("");
    attachStatusListeners();
  } catch(e) {
    $("tests-loading").textContent = "Error: " + (e.message || "unknown");
  }
}

// ---- Status change ----
function attachStatusListeners() {
  document.querySelectorAll(".status-select").forEach(sel => {
    sel.addEventListener("change", async (e) => {
      const { id, type } = e.target.dataset;
      const status = e.target.value;
      try {
        if (type === "assignment") await api("PUT", "update_assignment", { id, status });
        else await api("PUT", "update_test", { id, status });
      } catch(err) {
        alert("Error updating: " + err.message);
      }
    });
  });
}

// ---- Add assignment ----
$("save-assignment-btn").addEventListener("click", async () => {
  const name = $("a-name").value.trim();
  const subject = $("a-subject").value.trim();
  const due_date = $("a-due").value;
  $("a-error").textContent = "";
  if (!name || !subject || !due_date) { $("a-error").textContent = "Please fill in all required fields."; return; }
  $("save-assignment-btn").disabled = true;
  $("save-assignment-btn").textContent = "Adding...";
  try {
    await api("POST", "create_assignment", { name, subject, due_date, difficulty: $("a-difficulty").value, weight: $("a-weight").value });
    $("a-name").value = ""; $("a-subject").value = ""; $("a-due").value = "";
    show("a-success"); setTimeout(() => hide("a-success"), 3000);
  } catch(e) {
    $("a-error").textContent = e.message;
  } finally {
    $("save-assignment-btn").disabled = false;
    $("save-assignment-btn").textContent = "Add Assignment";
  }
});

// ---- Add test ----
$("save-test-btn").addEventListener("click", async () => {
  const name = $("t-name").value.trim();
  const subject = $("t-subject").value.trim();
  const test_date = $("t-date").value;
  $("t-error").textContent = "";
  if (!name || !subject || !test_date) { $("t-error").textContent = "Please fill in all required fields."; return; }
  $("save-test-btn").disabled = true;
  $("save-test-btn").textContent = "Adding...";
  try {
    await api("POST", "create_test", { name, subject, test_date, difficulty: $("t-difficulty").value, topics: $("t-topics").value.trim() });
    $("t-name").value = ""; $("t-subject").value = ""; $("t-date").value = ""; $("t-topics").value = "";
    show("t-success"); setTimeout(() => hide("t-success"), 3000);
  } catch(e) {
    $("t-error").textContent = e.message;
  } finally {
    $("save-test-btn").disabled = false;
    $("save-test-btn").textContent = "Add Test";
  }
});

// ---- Init ----
// Load stored email and token from chrome.storage.local, then init UI
chrome.storage.local.get(["gg_ext_email", "gg_ext_token"], (result) => {
  _emailCache = result.gg_ext_email || null;
  _tokenCache = result.gg_ext_token || null;
  if (_emailCache && _tokenCache) { showMain(); } else { show("login-screen"); }
});
`;

export default function ChromeExtensionPage() {
  const [downloading, setDownloading] = useState(false);

  const resizeIcon = (imgBlob, size) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      canvas.getContext("2d").drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, "image/png");
    };
    img.src = url;
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("manifest.json", MANIFEST);
      zip.file("popup.html", POPUP_HTML);
      zip.file("popup.css", POPUP_CSS);
      zip.file("popup.js", POPUP_JS);

      // Fetch and resize the icon at 3 sizes for the toolbar
      const iconRes = await fetch(ICON_URL);
      const iconBlob = await iconRes.blob();
      for (const size of [16, 48, 128]) {
        const resized = await resizeIcon(iconBlob, size);
        zip.file(`icon${size}.png`, resized);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gradeguard-extension.zip";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <Chrome className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">GradeGuard Chrome Extension</h1>
        <p className="text-gray-500">Access your AI study plan and manage tasks right from your browser toolbar.</p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Sparkles, title: "AI Study Plan", desc: "Today's personalized plan at a glance" },
          { icon: BookOpen, title: "Add Assignments & Tests", desc: "Quickly log tasks without leaving your tab" },
          { icon: CheckCircle2, title: "Update Status", desc: "Mark items done or in-progress instantly" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white/70 border border-white/80 rounded-xl p-4 backdrop-blur">
            <Icon className="w-5 h-5 text-indigo-500 mb-2" />
            <div className="font-semibold text-gray-800 text-sm">{title}</div>
            <div className="text-xs text-gray-500 mt-1">{desc}</div>
          </div>
        ))}
      </div>

      {/* Download */}
      <div className="bg-white/70 border border-white/80 rounded-xl p-6 backdrop-blur text-center space-y-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 text-base font-semibold h-auto"
        >
          <Download className="w-5 h-5 mr-2" />
          {downloading ? "Preparing..." : "Download Extension (.zip)"}
        </Button>
        <p className="text-xs text-gray-400">Chrome only · No account required (uses your existing GradeGuard email)</p>
      </div>

      {/* Instructions */}
      <div className="bg-white/70 border border-white/80 rounded-xl p-6 backdrop-blur space-y-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-indigo-500" />
          Installation Instructions
        </h2>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Click the download button above and unzip the file</li>
          <li>Open Chrome and go to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">chrome://extensions</code></li>
          <li>Enable <strong>Developer Mode</strong> using the toggle in the top-right</li>
          <li>Click <strong>Load unpacked</strong> and select the unzipped <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">gradeguard-extension</code> folder</li>
          <li>The 🎓 icon will appear in your Chrome toolbar — click it and sign in with your GradeGuard email!</li>
        </ol>
      </div>
    </div>
  );
}