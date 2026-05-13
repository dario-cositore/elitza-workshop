/* Elitza Agent Installer v1.0.7 - Analog UI + High-Perf Shader Engine Edition
 I ncl*udes identical business logic overlaid with a purely visual GPU abstraction layer.
 */

// --- BEGIN SHADER LAYER (GPU-ACCELERATED HALOTONE ENGINE) ---
// This acts as the hyper-fast background animation, yielding native/Rust-like rendering speeds.
(function initializeAliveCanvas() {
  const canvas = document.getElementById("alive-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl");
  if (!gl) return;

  const vsSource = `
  attribute vec4 aVertexPosition;
  void main() { gl_Position = aVertexPosition; }
  `;
  // Fluid noise/halftone xerox grain shader
  const fsSource = `
  precision highp float;
  uniform float uTime;
  uniform vec2 uResolution;

  // Pseudo-random noise function
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    // Fluid warp
    float time = uTime * 0.2;
    vec2 warp = p;
    warp.x += sin(time + p.y * 2.0) * 0.2;
    warp.y += cos(time + p.x * 2.5) * 0.2;

    // Generate grain noise
    float n = noise(warp * 8.0 + time);
    n += noise(warp * 16.0 - time) * 0.5;

    // Halftone calculation
    float dots = sin(uv.x * 200.0) * sin(uv.y * 200.0);
    float thresh = smoothstep(0.4, 0.6, n);
    float finalTone = step(thresh, dots * 0.5 + 0.5);

    // Subtle color tint mapping (cream/off-white)
    vec3 col = mix(vec3(0.96, 0.94, 0.90), vec3(0.85, 0.8, 0.75), finalTone * 0.2);
    gl_FragColor = vec4(col, 1.0);
  }
  `;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vsSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fsSource));
  gl.linkProgram(program);
  gl.useProgram(program);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const posAttr = gl.getAttribLocation(program, "aVertexPosition");
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const timeLoc = gl.getUniformLocation(program, "uTime");
  const resLoc = gl.getUniformLocation(program, "uResolution");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
  }
  window.addEventListener("resize", resize);
  resize();

  let start = performance.now();
  function render(time) {
    gl.uniform1f(timeLoc, (time - start) / 1000.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
})();
// --- END SHADER LAYER ---


/* === ORIGINAL ELITZA LOGIC RETAINED BELOW EXACTLY === */
const INSTALLER_VERSION = "2.0.0";
const INSTALL_MODE = "park_new_agent";
const STEP_TOTAL = 5;

let workspaceHandle = null;
let packageZip = null;
let packageManifest = null;
let packageEntries =[];
let packageRoot = "";
let packageFileName = "";
let installPlan = null;
let registrationCommand = "";
let repairCommand = "";
let removeCommand = "";
let currentStep = 1;
let isTransitioning = false;
let targetPlatform = 'openclaw'; // 'openclaw' | 'hermes'

const BLOCKED_PATH_PARTS =[
  "../", "..\\", "/etc/", "/usr/", "/bin/", "/root/", ".ssh", "id_rsa",
"authorized_keys", "known_hosts"
];

const BLOCKED_SECRET_PATTERNS =[
  "OPENAI_API_KEY", "OPENROUTER_API_KEY", "ANTHROPIC_API_KEY",
"GOOGLE_APPLICATION_CREDENTIALS", "password=", "secret=", "api_key=", "apikey="
];

const BLOCKED_EXTENSIONS =[
  ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd", ".exe",
".dll", ".dylib", ".so", ".app", ".msi", ".deb", ".rpm", ".pkg"
];

const ROOT_PROFILE_MAP = {
  "profile/AGENTS.md": "AGENTS.md",
  "profile/SOUL.md": "SOUL.md",
  "profile/TOOLS.md": "TOOLS.md",
  "profile/BOOTSTRAP.md": "BOOTSTRAP.md",
  "profile/IDENTITY.md": "IDENTITY.md",
  "profile/MEMORY.md": "MEMORY.md",
  "profile/ROUTINES.md": "ROUTINES.md",
  "profile/USER.md": "USER.md",
  "profile/BOOT_SEQUENCE.md": "BOOT_SEQUENCE.md"
};

const LAYER_PREFIXES =["kernel/", "skills/", "memory/", "knowledge/", "tools/", "guides/", "examples/", "assets/"];

const HERMES_PROFILE_MAP = {
  "profile/SOUL.md": "SOUL.md",
  "profile/MEMORY.md": "MEMORY.md",
  "profile/USER.md": "USER.md",
};

const COMMAND_PROFILES = {
  powershell: { label: "Windows PowerShell", shortLabel: "PowerShell", scriptExt: "ps1", pathStyle: "windows", platform: "windows" },
  cmd: { label: "Windows Command Prompt", shortLabel: "Command Prompt", scriptExt: "cmd", pathStyle: "windows", platform: "windows" },
  posix: { label: "macOS / Linux Terminal", shortLabel: "zsh / bash", scriptExt: "sh", pathStyle: "posix", platform: "posix" },
  fish: { label: "Fish Shell", shortLabel: "fish", scriptExt: "fish", pathStyle: "posix", platform: "posix" }
};

const PROFILE_ORDER =["powershell", "posix", "fish", "cmd"];
const $ = (id) => document.getElementById(id);

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function slugify(value) {
  return String(value || "elitza-agent")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 72) || "elitza-agent";
}

function humanError(err) {
  if (err?.name === "AbortError") return "Selection cancelled.";
  return err?.message || String(err || "Unknown error.");
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function setHidden(idOrEl, hidden) {
  const el = typeof idOrEl === "string" ? $(idOrEl) : idOrEl;
  if (el) el.classList.toggle("hidden", Boolean(hidden));
}

function setInlineState(id, text, kind = "") {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  // Merges aesthetic text requirement (typewriter-text) with dynamic classes securely
  el.className = `inlineState ${kind} typewriter-text`.trim();
}

function getButtonLabel(button) {
  return button?.querySelector(".buttonLabel") || button?.querySelector("span") || button;
}

async function withButtonLoading(button, loadingLabel, task) {
  if (!button) return await task();
  const label = getButtonLabel(button);
  const originalText = label?.textContent || "";
  const wasDisabled = button.disabled;

  button.classList.add("is-loading");
  button.disabled = true;
  if (label) label.textContent = loadingLabel;

  try {
    return await task();
  } finally {
    button.classList.remove("is-loading");
    button.disabled = wasDisabled;
    if (label) label.textContent = originalText;
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

async function copyWithFeedback(button, text, copiedLabel = "Copied") {
  const label = getButtonLabel(button);
  const original = label?.textContent || "";
  try {
    await copyToClipboard(text);
    if (label) label.textContent = copiedLabel;
  } catch (err) {
    if (label) label.textContent = "Copy failed";
    throw err;
  } finally {
    if (label) { setTimeout(() => { label.textContent = original; }, 1200); }
  }
}

function updateProgress(step) {
  const fill = $("progressFill");
  if (fill) fill.style.width = `${((step - 1) / (STEP_TOTAL - 1)) * 100}%`;
  setText("stepLabel", `Step ${step} / ${STEP_TOTAL}`);
}

function showStep(step) {
  if (isTransitioning) return;
  const next = document.querySelector(`.flowStep[data-step="${step}"]`);
  if (!next || next.classList.contains('active')) return;
  const current = document.querySelector(".flowStep.active");

  isTransitioning = true;
  currentStep = step;
  updateProgress(step);

  if (!current) {
    next.classList.add("active");
    isTransitioning = false;
    return;
  }

  current.classList.remove("active");
  current.classList.add("exiting");

  setTimeout(() => {
    current.classList.remove("exiting");
    next.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
    isTransitioning = false;
  }, 260);
}

function detectPlatform() {
  const uaDataPlatform = navigator.userAgentData?.platform || "";
  const raw = `${uaDataPlatform} ${navigator.platform || ""} ${navigator.userAgent || ""}`.toLowerCase();
  if (raw.includes("win")) return "windows";
  if (raw.includes("mac")) return "macos";
  if (raw.includes("linux") || raw.includes("x11")) return "linux";
  return "unknown";
}

function defaultCommandProfile() {
  const platform = detectPlatform();
  if (platform === "windows") return "powershell";
  return "posix";
}

function platformLabel(platform = detectPlatform()) {
  if (platform === "windows") return "Windows detected";
  if (platform === "macos") return "macOS detected";
  if (platform === "linux") return "Linux detected";
  return "Platform not detected";
}

function defaultWorkspacePathForProfile(profileKey = defaultCommandProfile()) {
  if (profileKey === "powershell") return "$HOME\\.openclaw\\workspace";
  if (profileKey === "cmd") return "%USERPROFILE%\\.openclaw\\workspace";
  return "$HOME/.openclaw/workspace";
}

function populateCommandSelect(select, selected = defaultCommandProfile()) {
  if (!select) return;
  select.replaceChildren();
  for (const key of PROFILE_ORDER) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = COMMAND_PROFILES[key].label;
    select.appendChild(option);
  }
  select.value = selected;
}

function selectedProfileKey(selectId = "commandProfile") {
  const value = $(selectId)?.value || defaultCommandProfile();
  return COMMAND_PROFILES[value] ? value : defaultCommandProfile();
}

function normalizeWorkspaceBase(value) {
  const raw = String(value || "").trim().replace(/[\\/]+$/, "");
  if (!raw) throw new Error("Workspace path is required.");
  if (raw === "workspace" || raw.startsWith("workspace/") || raw.startsWith("workspace\\")) {
    throw new Error("Workspace path cannot be relative. Use the absolute path shown in OpenClaw.");
  }
  if (raw.startsWith("./") || raw.startsWith("../") || raw.startsWith(".\\") || raw.startsWith("..\\")) {
    throw new Error("Workspace path cannot be relative. Paste the path shown in OpenClaw.");
  }
  const isExpandable =
  raw === "~" || raw.startsWith("~/") || raw.startsWith("~\\") ||
  raw.startsWith("$HOME/") || raw.startsWith("$HOME\\") ||
  raw.startsWith("$env:USERPROFILE\\") || raw.startsWith("$env:USERPROFILE/") ||
  raw.startsWith("%USERPROFILE%\\") || raw.startsWith("%USERPROFILE%/");
  const isAbsolute = raw.startsWith("/") || raw.startsWith("\\\\") || /^[a-zA-Z]:[\\/]/.test(raw);

  if (!isExpandable && !isAbsolute) {
    throw new Error("Workspace path must be absolute or use $HOME, ~, $env:USERPROFILE, or %USERPROFILE%.");
  }
  return raw;
}

function canonicalWorkspaceBase(baseWorkspace, profileKey) {
  let value = normalizeWorkspaceBase(baseWorkspace);
  const style = COMMAND_PROFILES[profileKey]?.pathStyle || pathStyleFor(profileKey, value);

  if (style === "windows") {
    value = value
    .replace(/^~(?=$|[\\/])/, "$HOME")
    .replace(/^%USERPROFILE%/i, profileKey === "cmd" ? "%USERPROFILE%" : "$env:USERPROFILE")
    .replace(/\//g, "\\");
    return value.replace(/[\\/]+$/, "");
  }

  value = value
  .replace(/^~(?=$|[\\/])/, "$HOME")
  .replace(/^%USERPROFILE%([\\/]|$)/i, "$HOME$1")
  .replace(/^\$env:USERPROFILE([\\/]|$)/i, "$HOME$1");

  if (!/^[a-zA-Z]:[\\/]/.test(value)) {
    value = value.replace(/\\/g, "/");
  }
  return value.replace(/[\\/]+$/, "");
}

function pathStyleFor(profileKey, basePath = "") {
  if (COMMAND_PROFILES[profileKey]?.pathStyle === "windows") return "windows";
  if (/^[a-zA-Z]:[\\/]/.test(basePath) || basePath.includes("\\") || basePath.startsWith("%USERPROFILE%") || basePath.startsWith("$env:USERPROFILE")) return "windows";
  return "posix";
}

function joinCommandPath(base, parts, profileKey) {
  const style = pathStyleFor(profileKey, base);
  const sep = style === "windows" ? "\\" : "/";
  const cleanBase = String(base).replace(/[\\/]+$/, "");
  const cleanParts = parts.map(part => String(part).replace(/^[\\/]+|[\\/]+$/g, ""));
  return [cleanBase, ...cleanParts].filter(Boolean).join(sep);
}

function ensureZipSupported() {
  if (!window.JSZip) throw new Error("JSZip did not load. Check your connection.");
}

function ensureFolderSupported() {
  if (!("showDirectoryPicker" in window)) {
    throw new Error("Folder write access requires Chrome, Edge, or another Chromium browser over HTTPS or localhost.");
  }
}

function normalizeZipPath(path) { return path.replace(/^\/+/, "").replace(/\\/g, "/"); }

function detectPackageRoot(zip) {
  const all = Object.keys(zip.files).map(normalizeZipPath);
  if (zip.file("profile.manifest.json")) return "";

  const manifestCandidates = all.filter(name => name.endsWith("/profile.manifest.json"));
  if (manifestCandidates.length === 1) {
    return manifestCandidates[0].replace(/profile\.manifest\.json$/, "");
  }

  const topLevelFolders =[...new Set(all.filter(Boolean).map(name => name.split("/")[0]).filter(Boolean))];
  if (topLevelFolders.length === 1) {
    const candidateRoot = `${topLevelFolders[0]}/`;
    if (zip.file(`${candidateRoot}profile.manifest.json`)) return candidateRoot;
  }
  throw new Error("Package is missing profile.manifest.json. It must be at the zip root or inside one top-level folder.");
}

function withRoot(relativePath) { return `${packageRoot || ""}${relativePath}`; }

function stripRoot(path) {
  const p = normalizeZipPath(path);
  if (packageRoot && p.startsWith(packageRoot)) return p.slice(packageRoot.length);
  return p;
}

function isUnsafePath(path) {
  const logical = stripRoot(path);
  if (!logical) return false;
  if (logical.includes("../")) return true;
  if (logical.startsWith("etc/") || logical.startsWith("usr/") || logical.startsWith("bin/") || logical.startsWith("root/")) return true;
  return BLOCKED_PATH_PARTS.some(part => logical.includes(part));
}

function isBlockedExtension(path) {
  const lower = stripRoot(path).toLowerCase();
  return BLOCKED_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function detectSecretLikeContent(text) {
  return BLOCKED_SECRET_PATTERNS.some(pattern => text.includes(pattern));
}

async function getDir(parent, name, create = true) { return await parent.getDirectoryHandle(name, { create }); }
async function getFile(parent, name, create = true) { return await parent.getFileHandle(name, { create }); }

async function writeTextFile(dirHandle, name, content) {
  const fh = await getFile(dirHandle, name, true);
  const writable = await fh.createWritable();
  await writable.write(content);
  await writable.close();
}

async function readExistingTextFile(dirHandle, name) {
  try {
    const fh = await dirHandle.getFileHandle(name, { create: false });
    const file = await fh.getFile();
    return await file.text();
  } catch (_) { return null; }
}

async function copyZipFileToDir(zip, logicalPath, targetDir, targetName) {
  const physicalPath = withRoot(logicalPath);
  const entry = zip.file(physicalPath);
  if (!entry) return false;
  const data = await entry.async("uint8array");
  const fh = await getFile(targetDir, targetName, true);
  const writable = await fh.createWritable();
  await writable.write(data);
  await writable.close();
  return true;
}

async function ensurePathDir(root, pathParts) {
  let dir = root;
  for (const part of pathParts.filter(Boolean)) {
    dir = await getDir(dir, part, true);
  }
  return dir;
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object") throw new Error("Invalid or missing manifest JSON.");
  const schema = manifest.schema || "";
  if (!schema.includes("elitza")) throw new Error("Manifest schema does not look like an Elitza package.");
  if (!manifest.package_id && !manifest.profile_id) throw new Error("Manifest requires package_id or profile_id.");
  if (!manifest.package_name && !manifest.profile_name) throw new Error("Manifest requires package_name or profile_name.");
  if (manifest.security?.allow_executables === true || manifest.contains_executable_tools === true) {
    throw new Error("This package declares executable tools. Browser installer refuses executable packages.");
  }
  if (manifest.security?.allow_shell_scripts === true) {
    throw new Error("This package declares shell scripts. Browser installer refuses executable packages.");
  }
}

async function validateZip(zip) {
  packageRoot = detectPackageRoot(zip);
  const physicalNames = Object.keys(zip.files).map(normalizeZipPath);
  const logicalNames = physicalNames
  .filter(name => packageRoot ? name.startsWith(packageRoot) : true)
  .map(stripRoot)
  .filter(Boolean);

  for (const [rawName, entry] of Object.entries(zip.files)) {
    const physicalName = normalizeZipPath(rawName);
    if (entry?.dir) continue;
    if (packageRoot && !physicalName.startsWith(packageRoot)) {
      throw new Error(`Unexpected file outside package root blocked: ${physicalName}`);
    }
    if (isUnsafePath(physicalName)) throw new Error(`Unsafe path blocked: ${stripRoot(physicalName)}`);
    if (isBlockedExtension(physicalName)) throw new Error(`Executable/script file blocked: ${stripRoot(physicalName)}`);
  }

  const manifestEntry = zip.file(withRoot("profile.manifest.json"));
  if (!manifestEntry) throw new Error("Package is missing profile.manifest.json.");

  const manifestText = await manifestEntry.async("text");
  if (detectSecretLikeContent(manifestText)) throw new Error("Manifest contains secret-looking content. Refusing package.");

  let manifest;
  try { manifest = JSON.parse(manifestText); }
  catch (err) { throw new Error(`Manifest is not valid JSON: ${humanError(err)}`); }

  validateManifest(manifest);

  const required = targetPlatform === 'hermes'
    ? ["profile.manifest.json", "profile/SOUL.md"]
    : ["profile.manifest.json", "README.md", "profile/AGENTS.md", "profile/SOUL.md", "profile/TOOLS.md", "profile/BOOTSTRAP.md"];
  const missing = required.filter(req => !logicalNames.includes(req));
  if (missing.length) throw new Error(`Package missing required files: ${missing.join(", ")}`);

  return { manifest, names: logicalNames };
}

function count(prefix) { return packageEntries.filter(p => p.startsWith(prefix) && !p.endsWith("/")).length; }
function packageName() { return packageManifest?.package_name || packageManifest?.profile_name || "Elitza Agent"; }
function packageVersion() { return packageManifest?.package_version || packageManifest?.profile_version || packageManifest?.version || ""; }
function packageAuthor() { return packageManifest?.author || packageManifest?.publisher || "Elitza"; }
function packageDescription() { return packageManifest?.description || "A validated Elitza operator package ready to install as a parked OpenClaw agent."; }
function formatVersion(value) {
  if (!value) return "Version not set";
  const text = String(value);
  return text.toLowerCase().startsWith("v") ? text : `v${text}`;
}
function skillCount() {
  if (Array.isArray(packageManifest?.skills)) return packageManifest.skills.length;
  return packageEntries.filter(p => p.startsWith("skills/") && p.endsWith("skill.manifest.json")).length;
}

function contentSummary() {
  return[
    { label: "Profile", count: count("profile/") },
    { label: "Kernel", count: count("kernel/") },
    { label: "Skills", count: skillCount() },
    { label: "Memory", count: count("memory/") },
    { label: "Knowledge", count: count("knowledge/") },
    { label: "Tools", count: count("tools/") },
    { label: "Guides", count: count("guides/") + count("examples/") },
    { label: "Assets", count: count("assets/") }
  ];
}

function findGuidePath() {
  const preferred =["guides/00-start-here.md", "guides/01-install-openclaw.md", "README.md"];
  for (const path of preferred) { if (packageEntries.includes(path)) return path; }
  return packageEntries.find(path => path.startsWith("guides/") && path.endsWith(".md")) || "";
}

function buildAgentId() {
  const raw = packageManifest?.package_id || packageManifest?.profile_id || packageName();
  return slugify(String(raw).replace(/^elitza[.-]/, "elitza-"));
}

function hasPosixExpansion(value) { return String(value).startsWith("$HOME/"); }

function shString(value) {
  const text = String(value);
  if (hasPosixExpansion(text)) { return `"${text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/`/g, "\\`")}"`; }
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function psString(value) {
  const text = String(value);
  if (text.startsWith("$HOME") || text.startsWith("$env:USERPROFILE")) {
    return `"${text.replace(/`/g, "``").replace(/"/g, "`\"")}"`;
  }
  return `'${text.replace(/'/g, "''")}'`;
}

function cmdValue(value) { return String(value).replace(/"/g, ""); }

function fishString(value) {
  const text = String(value);
  if (hasPosixExpansion(text)) { return `"${text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`; }
  return `'${text.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
}

function commandProfileLabel(profileKey) {
  return COMMAND_PROFILES[profileKey]?.shortLabel || COMMAND_PROFILES[defaultCommandProfile()].shortLabel;
}

function buildParkedPath(baseWorkspace, agentId, profileKey = selectedProfileKey()) {
  return joinCommandPath(baseWorkspace,[".elitza", "agents", agentId, "workspace"], profileKey);
}

function buildRegistrationCommand(agentId, parkedPath, profileKey = selectedProfileKey()) {
  if (profileKey === "powershell") {
    return[`$agentId = ${psString(agentId)}`, `$workspace = ${psString(parkedPath)}`, ``, `openclaw agents add $agentId --workspace $workspace --non-interactive`, `openclaw agents list --bindings`].join("\n");
  }
  if (profileKey === "cmd") {
    return[`set "agent_id=${cmdValue(agentId)}"`, `set "workspace=${cmdValue(parkedPath)}"`, ``, `openclaw agents add "%agent_id%" --workspace "%workspace%" --non-interactive`, `openclaw agents list --bindings`].join("\r\n");
  }
  if (profileKey === "fish") {
    return[`set agent_id ${fishString(agentId)}`, `set workspace ${fishString(parkedPath)}`, ``, `openclaw agents add $agent_id --workspace $workspace --non-interactive`, `openclaw agents list --bindings`].join("\n");
  }
  return[`agent_id=${shString(agentId)}`, `workspace=${shString(parkedPath)}`, ``, `openclaw agents add "$agent_id" --workspace "$workspace" --non-interactive`, `openclaw agents list --bindings`].join("\n");
}

function buildRepairCommand(agentId, baseWorkspace, profileKey = selectedProfileKey()) {
  const id = slugify(agentId);
  const base = canonicalWorkspaceBase(baseWorkspace, profileKey);
  const workspace = buildParkedPath(base, id, profileKey);

  if (profileKey === "powershell") return[`$agentId = ${psString(id)}`, `$workspace = ${psString(workspace)}`, ``, `if (!(Test-Path (Join-Path $workspace 'AGENTS.md'))) { Write-Warning "AGENTS.md not found at $workspace" }`, `openclaw agents add $agentId --workspace $workspace --non-interactive`].join("\n");
  if (profileKey === "cmd") return[`set "agent_id=${cmdValue(id)}"`, `set "workspace=${cmdValue(workspace)}"`, ``, `if not exist "%workspace%\\AGENTS.md" echo WARNING: AGENTS.md not found`, `openclaw agents add "%agent_id%" --workspace "%workspace%" --non-interactive`].join("\r\n");
  if (profileKey === "fish") return[`set agent_id ${fishString(id)}`, `set workspace ${fishString(workspace)}`, ``, `test -f "$workspace/AGENTS.md"; or echo "WARNING: AGENTS.md not found"`, `openclaw agents add $agent_id --workspace $workspace --non-interactive`].join("\n");
  return [`agent_id=${shString(id)}`, `workspace=${shString(workspace)}`, ``, `[ -f "$workspace/AGENTS.md" ] || echo "WARNING: AGENTS.md not found"`, `openclaw agents add "$agent_id" --workspace "$workspace" --non-interactive`].join("\n");
}

function buildRemoveCommand(agentId, baseWorkspace, profileKey = selectedProfileKey()) {
  const id = slugify(agentId);
  const base = canonicalWorkspaceBase(baseWorkspace, profileKey);
  const workspace = buildParkedPath(base, id, profileKey);

  if (profileKey === "powershell") return[`$agentId = ${psString(id)}`, `Write-Host "Expected workspace: ${workspace}"`, `openclaw agents delete $agentId`].join("\n");
  if (profileKey === "cmd") return[`set "agent_id=${cmdValue(id)}"`, `echo Expected workspace: ${workspace}`, `openclaw agents delete "%agent_id%"`].join("\r\n");
  if (profileKey === "fish") return[`set agent_id ${fishString(id)}`, `echo "Expected workspace: ${workspace}"`, `openclaw agents delete $agent_id`].join("\n");
  return[`agent_id=${shString(id)}`, `echo "Expected workspace: ${workspace}"`, `openclaw agents delete "$agent_id"`].join("\n");
}

function buildAllCommands(agentId, baseWorkspace) {
  const commands = {};
  for (const key of PROFILE_ORDER) {
    const base = canonicalWorkspaceBase(baseWorkspace, key);
    const parkedPath = buildParkedPath(base, agentId, key);
    commands[key] = {
      label: COMMAND_PROFILES[key].label,
      script_ext: COMMAND_PROFILES[key].scriptExt,
      parked_workspace_for_command: parkedPath,
      register: buildRegistrationCommand(agentId, parkedPath, key),
      repair: buildRepairCommand(agentId, baseWorkspace, key),
      remove: buildRemoveCommand(agentId, baseWorkspace, key)
    };
  }
  return commands;
}

function appendLogicalPath(base, logicalPath, profileKey) {
  return joinCommandPath(base, String(logicalPath).split("/"), profileKey);
}

function currentMode() { return INSTALL_MODE; }

function buildPlan() {
  if (!workspaceHandle) throw new Error("Choose your OpenClaw workspace folder first.");
  if (!packageZip || !packageManifest) throw new Error("Choose a valid Elitza package first.");

  const commandProfile = selectedProfileKey();
  const rawBaseWorkspacePath = normalizeWorkspaceBase($("workspacePath").value);
  const baseWorkspacePath = canonicalWorkspaceBase(rawBaseWorkspacePath, commandProfile);
  const agentId = buildAgentId();
  const parkedPath = buildParkedPath(baseWorkspacePath, agentId, commandProfile);
  const allCommands = buildAllCommands(agentId, rawBaseWorkspacePath);
  registrationCommand = allCommands[commandProfile].register;

  installPlan = {
    mode: currentMode(),
    packageName: packageName(),
    packageVersion: packageVersion(),
    packageAuthor: packageAuthor(),
    packageDescription: packageDescription(),
    agentId, parkedPath, baseWorkspacePath, commandProfile,
    commandProfileLabel: commandProfileLabel(commandProfile),
    detectedPlatform: detectPlatform(),
    packageRoot: packageRoot || null,
    packageFileName,
    contentSummary: contentSummary(),
    guidePath: findGuidePath(),
    allCommands
  };

  return installPlan;
}

function renderContentsTags(container, items) {
  container.replaceChildren();
  for (const item of items) {
    const tag = document.createElement("span");
    tag.className = `contentTag ${item.count ? "" : "empty"}`.trim();
    tag.textContent = item.count ? `${item.label} ${item.count}` : item.label;
    container.appendChild(tag);
  }
}

function renderPackageSummary() {
  const items = contentSummary();
  setText("packageName", packageName());
  setText("packageVersion", formatVersion(packageVersion()));
  setText("packageAuthor", packageAuthor());
  setText("packageDescription", packageDescription());
  setText("packageSkills", `${skillCount()} ${skillCount() === 1 ? "skill" : "skills"} included`);
  renderContentsTags($("contentsTags"), items);

  const rootText = packageRoot ? `Root: ${packageRoot.replace(/\/$/, "")}` : "Root: zip root";
  setInlineState("packageStatus", `> ${packageFileName} ACCEPTED. ${rootText}. Checksums passed.`, "success");
  setHidden("packageSummary", false);
  $("packageContinue").disabled = false;
}

function resetPackageState() {
  packageZip = null; packageManifest = null; packageEntries =[];
  packageRoot = ""; packageFileName = ""; installPlan = null;
  registrationCommand = "";
  setHidden("packageSummary", true);
  $("packageContinue").disabled = true;
}

async function handlePackageFile(file) {
  if (!file) return;
  resetPackageState();
  const dropZone = $("dropZone");
  dropZone.classList.add("busy");
  setInlineState("packageStatus", "> initializing parse protocol...", "muted");

  try {
    ensureZipSupported();
    if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("Format rejected. Ensure .zip archive.");

    const zip = await JSZip.loadAsync(file);
    const result = await validateZip(zip);
    packageZip = zip;
    packageManifest = result.manifest;
    packageEntries = result.names.filter(name => !name.endsWith("/"));
    packageFileName = file.name;
    renderPackageSummary();
  } catch (err) {
    resetPackageState();
    setInlineState("packageStatus", `> FATAL ERROR: ${humanError(err)}`, "error");
  } finally {
    dropZone.classList.remove("busy");
  }
}

function renderWorkspaceReadiness() {
  if (targetPlatform === 'hermes') {
    $("workspaceContinue").disabled = !workspaceHandle;
    return;
  }
  let pathIsValid = false;
  try {
    const base = normalizeWorkspaceBase($("workspacePath").value);
    pathIsValid = true;
    setInlineState("pathStatus", `> Environment path localized: ${base}`, "success");
  } catch (err) {
    setInlineState("pathStatus", `> Path Error: ${humanError(err)}`, "error");
  }
  $("workspaceContinue").disabled = !(workspaceHandle && pathIsValid);
}

function renderReview() {
  if (targetPlatform === 'hermes') {
    if (!workspaceHandle || !packageManifest) throw new Error("Missing package or folder selection.");
    installPlan = {
      mode: 'hermes', platform: 'hermes',
      packageName: packageName(), packageVersion: packageVersion(),
      packageAuthor: packageAuthor(), packageDescription: packageDescription(),
      contentSummary: contentSummary(), packageRoot: packageRoot || null,
      packageFileName, hasSkills: count("skills/") > 0,
    };
    setText("reviewPackageName", `${packageName()}${packageVersion() ? ` ${formatVersion(packageVersion())}` : ""}`);
    setHidden("reviewAgentIdRow", true);
    setText("reviewTargetPath", `~/.hermes/ — ${workspaceHandle.name}`);
    setText("detectedPlatform", `${platformLabel(detectPlatform())} — Hermes Agent`);
    setHidden("reviewCommandProfileRow", true);
    setHidden("installError", true);
    setHidden("installProgress", true);
    $("installProgressFill").style.width = "0%";
    setText("installPhaseText", "> staging operations...");
    return;
  }
  const plan = buildPlan();
  setHidden("reviewAgentIdRow", false);
  setHidden("reviewCommandProfileRow", false);
  setText("reviewPackageName", `${plan.packageName}${plan.packageVersion ? ` ${formatVersion(plan.packageVersion)}` : ""}`);
  setText("reviewAgentId", plan.agentId);
  setText("reviewTargetPath", plan.parkedPath);
  setText("detectedPlatform", `${platformLabel(plan.detectedPlatform)}. ${COMMAND_PROFILES[plan.commandProfile].label} selected.`);
  setHidden("installError", true);
  setHidden("installProgress", true);
  $("installProgressFill").style.width = "0%";
  setText("installPhaseText", "> staging operations...");
}

function mdCell(value) { return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || "Not provided"; }

function formatContentTable(items) {
  return["| Layer | Files |", "| --- | ---: |", ...items.map(item => `| ${mdCell(item.label)} | ${item.count} |`)].join("\n");
}

function buildReceipt(plan) {
  const reportPath = appendLogicalPath(plan.parkedPath, "ELITZA_INSTALL_REPORT.md", plan.commandProfile);
  const guidePath = plan.guidePath ? appendLogicalPath(plan.parkedPath, plan.guidePath, plan.commandProfile) : null;
  return {
    installed_at: new Date().toISOString(), installer: "Elitza Agent Installer", installer_version: INSTALLER_VERSION,
    install_mode: INSTALL_MODE, selected_command_profile: plan.commandProfile, detected_platform: plan.detectedPlatform,
    package: { file_name: plan.packageFileName || null, package_root: plan.packageRoot, package_name: plan.packageName, package_version: plan.packageVersion || null, author: plan.packageAuthor, description: plan.packageDescription, manifest: packageManifest, entries: packageEntries },
    contents: plan.contentSummary, agent_id: plan.agentId,
    paths: { base_workspace_for_command: plan.baseWorkspacePath, parked_workspace_for_selected_command: plan.parkedPath, install_report: reportPath, getting_started_guide: guidePath },
    commands: plan.allCommands, registration_command_selected: registrationCommand, current_agent_modified: false, activation_status: "prepared_registration_required",
    security: { unsafe_paths_blocked: true, executable_extensions_blocked: true, manifest_secret_patterns_blocked: true, executable_tools_refused: true, shell_scripts_in_package_refused: true }
  };
}

function buildInstallReport(plan, receipt) {
  const guideLine = plan.guidePath ? `Getting started guide: \`${plan.guidePath}\`` : "Getting started guide: not included";
  const commandSections = PROFILE_ORDER.map(key => {
    const command = plan.allCommands[key];
    const fence = key === "powershell" ? "powershell" : key === "cmd" ? "bat" : key === "fish" ? "fish" : "sh";
    return `### ${command.label}\n\n\`\`\`${fence}\n${command.register}\n\`\`\``;
  }).join("\n\n");
  return `# Elitza Install Report\n\nGenerated by Elitza Installer v${INSTALLER_VERSION}\n\n## Agent\n\n| Field | Value |\n| --- | --- |\n| Package | ${mdCell(plan.packageName)} |\n| Version | ${mdCell(plan.packageVersion || "Not provided")} |\n| Author | ${mdCell(plan.packageAuthor)} |\n| Agent ID | \`${mdCell(plan.agentId)}\` |\n| Activation status | Prepared; registration required |\n\n## Package Contents\n\n${formatContentTable(plan.contentSummary)}\n\n${guideLine}\n\n## Register with OpenClaw\n\n\`\`\`txt\n${registrationCommand}\n\`\`\`\n\n## Receipt JSON\n\n\`\`\`json\n${JSON.stringify(receipt, null, 2)}\n\`\`\`\n`;
}

async function writeCommandScripts(metaDir, plan) {
  for (const key of PROFILE_ORDER) {
    const command = plan.allCommands[key];
    const ext = command.script_ext;
    await writeTextFile(metaDir, `register-agent.${ext}`, command.register + "\n");
    await writeTextFile(metaDir, `repair-agent.${ext}`, command.repair + "\n");
    await writeTextFile(metaDir, `uninstall-agent.${ext}`, command.remove + "\n");
  }
}

async function installParkedNewAgent(zip, plan) {
  const elitzaDir = await getDir(workspaceHandle, ".elitza", true);
  const agentsDir = await getDir(elitzaDir, "agents", true);
  const agentDir = await getDir(agentsDir, plan.agentId, true);
  const parkedWorkspace = await getDir(agentDir, "workspace", true);
  const metaDir = await getDir(agentDir, "meta", true);

  for (const [source, target] of Object.entries(ROOT_PROFILE_MAP)) {
    if (zip.file(withRoot(source))) await copyZipFileToDir(zip, source, parkedWorkspace, target);
  }

  for (const name of packageEntries) {
    if (!LAYER_PREFIXES.some(prefix => name.startsWith(prefix))) continue;
    if (name.endsWith("/")) continue;
    const parts = name.split("/");
    const filename = parts.pop();
    const dir = await ensurePathDir(parkedWorkspace, parts);
    await copyZipFileToDir(zip, name, dir, filename);
  }

  const packageMeta = await getDir(parkedWorkspace, ".elitza-package", true);
  for (const source of["profile.manifest.json", "README.md", "LICENSE.md", "changelog.md", "PACKAGE_TREE.md", "INSTALL_WITH_ELITZA_INJECTOR.md"]) {
    if (zip.file(withRoot(source))) await copyZipFileToDir(zip, source, packageMeta, source);
  }

  const receipt = buildReceipt(plan);
  await writeTextFile(metaDir, "package-receipt.json", JSON.stringify(receipt, null, 2));
  await writeCommandScripts(metaDir, plan);
  await writeTextFile(parkedWorkspace, "ELITZA_INSTALL_REPORT.md", buildInstallReport(plan, receipt));

  return receipt;
}

async function installHermesAgent(zip) {
  for (const [source, target] of Object.entries(HERMES_PROFILE_MAP)) {
    if (zip.file(withRoot(source))) await copyZipFileToDir(zip, source, workspaceHandle, target);
  }
  for (const name of packageEntries) {
    if (!name.startsWith("skills/")) continue;
    if (name.endsWith("/")) continue;
    const parts = name.split("/");
    const filename = parts.pop();
    const dir = await ensurePathDir(workspaceHandle, parts);
    await copyZipFileToDir(zip, name, dir, filename);
  }
}

function renderDoneHermes() {
  setText("hermesAgentName", installPlan.packageName);
  setHidden("hermesSkillNote", !installPlan.hasSkills);
  setHidden("openclawDoneSection", true);
  setHidden("hermesDoneSection", false);
  setText("doneTitle", "Profile installed.");
  setText("doneLead", "No terminal needed — your Hermes profile is ready.");
}

function setPlatform(platform) {
  targetPlatform = platform;
  workspaceHandle = null;
  setInlineState("workspaceStatus", "> folder not selected...", "muted");
  setInlineState("pathStatus", "> path not confirmed.", "muted");
  setHidden("openclawWorkspaceInfo", platform !== 'openclaw');
  setHidden("hermesWorkspaceInfo", platform !== 'hermes');
  setHidden("openclawPathInput", platform !== 'openclaw');
  setHidden("reviewAgentIdRow", platform !== 'openclaw');
  setHidden("reviewCommandProfileRow", platform !== 'openclaw');
  setHidden("openclawDoneSection", platform !== 'openclaw');
  setHidden("hermesDoneSection", platform !== 'hermes');
  const btn = $("selectWorkspace");
  if (btn) {
    const label = btn.querySelector(".buttonLabel");
    if (label) label.textContent = platform === 'hermes' ? "Select ~/.hermes Folder" : "Select .openclaw/workspace Folder";
  }
}

async function setInstallPhase(text, percent, waitMs = 650) {
  const phase = $("installPhaseText");
  setText("installPhaseText", text);
  $("installProgressFill").style.width = `${percent}%`;
  await delay(waitMs);
}

function renderDone(receipt) {
  setText("doneCommand", registrationCommand);
  setText("doneCommandProfile", COMMAND_PROFILES[installPlan.commandProfile].label);
  setText("doneAgentId", installPlan.agentId);
  setText("receiptPath", `> install_report generated at: ${receipt.paths.install_report}`);

  if (installPlan.guidePath) {
    const guideAbsolutePath = appendLogicalPath(installPlan.parkedPath, installPlan.guidePath, installPlan.commandProfile);
    setHidden("guideStep", false);
    $("guideLink").dataset.path = guideAbsolutePath;
  } else {
    setHidden("guideStep", true);
  }
}

async function runInstall() {
  setHidden("installError", true);
  setHidden("installProgress", false);
  await setInstallPhase("> Extracting package arrays...", 18, 620);
  await setInstallPhase("> Committing files to local disk...", 48, 220);
  if (targetPlatform === 'hermes') {
    await installHermesAgent(packageZip);
    await setInstallPhase("> Finalizing Hermes profile...", 82, 620);
    renderDoneHermes();
  } else {
    const receipt = await installParkedNewAgent(packageZip, installPlan);
    await setInstallPhase("> Formatting OS protocol command...", 82, 620);
    renderDone(receipt);
  }
  await setInstallPhase("> Execution finalized.", 100, 560);
  showStep(5);
}

function bindPackageDropZone() {
  const dropZone = $("dropZone");
  const fileInput = $("packageFile");

  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); fileInput.click(); }
  });
  for (const eventName of["dragenter", "dragover"]) {
    dropZone.addEventListener(eventName, (event) => { event.preventDefault(); dropZone.classList.add("dragging"); });
  }
  for (const eventName of["dragleave", "drop"]) {
    dropZone.addEventListener(eventName, () => { dropZone.classList.remove("dragging"); });
  }
  dropZone.addEventListener("drop", async (event) => {
    event.preventDefault();
    await handlePackageFile(event.dataTransfer?.files?.[0]);
  });
  fileInput.addEventListener("change", async (event) => {
    await handlePackageFile(event.target.files?.[0]);
  });
}

function bindMainFlow() {
  if ($("beginOpenClaw")) {
    $("beginOpenClaw").addEventListener("click", async () => {
      await withButtonLoading($("beginOpenClaw"), "Initializing...", async () => {
        setPlatform('openclaw'); await delay(160); showStep(2);
      });
    });
  }
  if ($("beginHermes")) {
    $("beginHermes").addEventListener("click", async () => {
      await withButtonLoading($("beginHermes"), "Initializing...", async () => {
        setPlatform('hermes'); await delay(160); showStep(2);
      });
    });
  }

  $("packageContinue").addEventListener("click", async () => {
    await withButtonLoading($("packageContinue"), "Proceeding...", async () => {
      if (!packageManifest) throw new Error("Requires valid payload.");
      await delay(160); showStep(3);
    });
  });

  $("selectWorkspace").addEventListener("click", async () => {
    await withButtonLoading($("selectWorkspace"), "Interfacing...", async () => {
      try {
        ensureFolderSupported();
        workspaceHandle = await window.showDirectoryPicker({ mode: "readwrite" });
        setInlineState("workspaceStatus", `> Linked volume: ${workspaceHandle.name || "workspace"}`, "success");
        renderWorkspaceReadiness();
      } catch (err) {
        setInlineState("workspaceStatus", `> Sync failure: ${humanError(err)}`, "error");
        renderWorkspaceReadiness();
      }
    });
  });

  $("workspacePath").addEventListener("input", renderWorkspaceReadiness);

  $("workspaceContinue").addEventListener("click", async () => {
    await withButtonLoading($("workspaceContinue"), "Processing...", async () => {
      try { renderReview(); await delay(160); showStep(4); }
      catch (err) { setInlineState("pathStatus", `> Fault: ${humanError(err)}`, "error"); }
    });
  });

  $("commandProfile").addEventListener("change", () => {
    if (!installPlan) return;
    renderReview();
  });

  $("copyAgentId").addEventListener("click", async () => {
    await copyWithFeedback($("copyAgentId"), installPlan?.agentId || $("reviewAgentId").textContent);
  });

  $("installButton").addEventListener("click", async () => {
    await withButtonLoading($("installButton"), "Extracting...", async () => {
      try { if (!installPlan) buildPlan(); await runInstall(); }
      catch (err) {
        setHidden("installProgress", true); setHidden("installError", false);
        setInlineState("installError", `> Critical failure: ${humanError(err)}`, "error");
      }
    });
  });

  $("copyCommand").addEventListener("click", async () => {
    await copyWithFeedback($("copyCommand"), registrationCommand);
  });

  $("guideLink").addEventListener("click", async (event) => {
    event.preventDefault();
    const path = $("guideLink").dataset.path;
    if (!path) return;
    await copyWithFeedback($("guideLink"), path, "Path copied");
  });
}

function bindAdvancedTools() {
  const genRepair = $("generateRepair");
  const genRemove = $("generateRemove");
  if (!genRepair && !genRemove) return;

  if (genRepair) {
    genRepair.addEventListener("click", () => {
      try {
        const id = $("repairAgentId").value;
        const base = normalizeWorkspaceBase($("repairWorkspacePath").value);
        const profileKey = selectedProfileKey("repairCommandProfile");
        repairCommand = buildRepairCommand(id, base, profileKey);
        $("repairCommand").textContent = repairCommand;
        setHidden("repairCommandPanel", false);
        if ($("copyRepair")) $("copyRepair").disabled = false;
      } catch (err) {
        if ($("repairCommand")) $("repairCommand").textContent = `> Error: ${humanError(err)}`;
        setHidden("repairCommandPanel", false);
        if ($("copyRepair")) $("copyRepair").disabled = true;
      }
    });
    if ($("copyRepair")) $("copyRepair").addEventListener("click", async () => { await copyWithFeedback($("copyRepair"), repairCommand); });
  }

  if (genRemove) {
    genRemove.addEventListener("click", () => {
      try {
        const id = $("removeAgentId").value;
        const base = normalizeWorkspaceBase($("removeWorkspacePath").value);
        const profileKey = selectedProfileKey("removeCommandProfile");
        removeCommand = buildRemoveCommand(id, base, profileKey);
        $("removeCommand").textContent = removeCommand;
        setHidden("removeCommandPanel", false);
        if ($("copyRemove")) $("copyRemove").disabled = false;
      } catch (err) {
        if ($("removeCommand")) $("removeCommand").textContent = `> Error: ${humanError(err)}`;
        setHidden("removeCommandPanel", false);
        if ($("copyRemove")) $("copyRemove").disabled = true;
      }
    });
    if ($("copyRemove")) $("copyRemove").addEventListener("click", async () => { await copyWithFeedback($("copyRemove"), removeCommand); });
  }
}

function init() {
  const profile = defaultCommandProfile();
  updateProgress(1);
  populateCommandSelect($("commandProfile"), profile);
  if ($("repairCommandProfile")) populateCommandSelect($("repairCommandProfile"), profile);
  if ($("removeCommandProfile")) populateCommandSelect($("removeCommandProfile"), profile);
  $("workspacePath").value = defaultWorkspacePathForProfile(profile);
  if ($("repairWorkspacePath")) $("repairWorkspacePath").value = defaultWorkspacePathForProfile(profile);
  if ($("removeWorkspacePath")) $("removeWorkspacePath").value = defaultWorkspacePathForProfile(profile);
  bindPackageDropZone();
  bindMainFlow();
  bindAdvancedTools();
  bindBackButtons();
  renderWorkspaceReadiness();
  const advBtn = $("advancedToolsBtn");
  if (advBtn) advBtn.addEventListener("click", () => navigateTo('adv'));
  const setupHermesBtn = $("setupHermesBtn");
  if (setupHermesBtn) setupHermesBtn.addEventListener("click", () => navigateTo('hs1'));
}

/* ================================================================
   BACK / STEP NAVIGATION
   ================================================================ */
function navigateTo(target) {
  if (typeof target === 'string' && target.startsWith('hs')) {
    document.querySelectorAll('.flowStep').forEach(el => el.classList.remove('active', 'exiting'));
    const el = document.querySelector(`.flowStep[data-step="${target}"]`);
    if (el) el.classList.add('active');
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = '0%';
    const stepLabel = document.getElementById('stepLabel');
    if (stepLabel) stepLabel.textContent = 'Hermes Setup';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (typeof target === 'string' && target.startsWith('s')) {
    if (window._showSetupStep) window._showSetupStep(target);
  } else if (target === 'adv') {
    document.querySelectorAll('.flowStep').forEach(el => el.classList.remove('active', 'exiting'));
    const advEl = document.querySelector('.flowStep[data-step="adv"]');
    if (advEl) advEl.classList.add('active');
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = '0%';
    const stepLabel = document.getElementById('stepLabel');
    if (stepLabel) stepLabel.textContent = 'Advanced Tools';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showStep(Number(target));
  }
}

function bindBackButtons() {
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.goto));
  });
}

/* ================================================================
   OPENCLAW SETUP GUIDE — Interactive Install Wizard
   ================================================================ */
const SetupGuide = (() => {
  // State
  let detectedOs = 'unknown';
  let currentSetupStep = 1;
  let isSetupTransitioning = false;

  const SETUP_STEP_IDS = ['s1', 's2', 's3', 's4', 's5', 's6'];

  // OpenClaw install commands per OS
  // Requires Node 24 (recommended) or Node 22 LTS (22.16+)
  const INSTALL_COMMANDS = {
    windows: {
      label: 'Windows Terminal / PowerShell',
      terminalName: 'Terminal',
      terminalHelp: `
        <strong>Windows:</strong> Press <code>Win + X</code> and click <strong>Terminal</strong> or <strong>Windows PowerShell</strong>.<br>
        Or search <strong>"Terminal"</strong> in the Start menu. Make sure Node.js 22+ is installed first — <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a>.
      `,
      install: `npm install -g openclaw@latest`,
      verify: `openclaw --version`,
      onboard: `openclaw onboard --install-daemon`,
      dashboard: `openclaw dashboard`
    },
    macos: {
      label: 'macOS Terminal',
      terminalName: 'Terminal',
      terminalHelp: `
        <strong>Mac:</strong> Press <code>Cmd + Space</code>, type <strong>Terminal</strong>, press Enter.<br>
        Or open Finder → Applications → Utilities → Terminal. Make sure Node.js 22+ is installed — <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a>.
      `,
      install: `npm install -g openclaw@latest`,
      verify: `openclaw --version`,
      onboard: `openclaw onboard --install-daemon`,
      dashboard: `openclaw dashboard`
    },
    linux: {
      label: 'Linux Terminal',
      terminalName: 'Terminal',
      terminalHelp: `
        <strong>Linux:</strong> Press <code>Ctrl + Alt + T</code> to open a terminal.<br>
        Or search "Terminal" in your application menu. Make sure Node.js 22+ is installed — <a href="https://nodejs.org" target="_blank" rel="noopener">nodejs.org</a>.
      `,
      install: `npm install -g openclaw@latest`,
      verify: `openclaw --version`,
      onboard: `openclaw onboard --install-daemon`,
      dashboard: `openclaw dashboard`
    }
  };

  // Detailed error detection per step with actionable hints
  // Each pattern matches what might appear in terminal output and gives a specific, helpful response.
  const STEP_ERRORS = {
    install: [
      // Node.js not installed or npm not found
      { pattern: /npm.*command not found|'npm'.*not found|npm: command not found/i, hint: "npm is not installed. Install Node.js 24 (or 22.16+) from https://nodejs.org — it includes npm. Then restart your terminal and run `npm install -g openclaw@latest` again." },
      { pattern: /node.*command not found|'node'.*not found|node: command not found/i, hint: "Node.js is not installed. Download and install Node 24 from https://nodejs.org, restart your terminal, then try again." },
      { pattern: /node.*version.*required|engine.*node|requires.*node.*\d+|node.*\d+.*required/i, hint: "Your Node.js version is too old. OpenClaw needs Node 24 (recommended) or 22.16+. Download the latest from https://nodejs.org, install it, restart your terminal, then try again." },
      // npm permission errors
      { pattern: /EACCES.*permission denied|permission denied.*npm|EPERM.*npm/i, hint: "npm permission error. Fix it by running: `sudo npm install -g openclaw@latest` (macOS/Linux). On Windows, run PowerShell as Administrator. Or use nvm to manage Node without sudo: https://github.com/nvm-sh/nvm" },
      { pattern: /EPERM|operation not permitted/i, hint: "Permission denied. Try running your terminal as Administrator (Windows) or use `sudo npm install -g openclaw@latest` (macOS/Linux)." },
      // Network errors
      { pattern: /ECONNREFUSED|ECONNRESET|ETIMEDOUT|fetch failed|network error|getaddrinfo.*failed/i, hint: "Network error connecting to the npm registry. Check your internet connection. If you're on a VPN or corporate network, try disabling it temporarily. Then run `npm install -g openclaw@latest` again." },
      { pattern: /npm.*ERR.*E404|not found.*openclaw|openclaw.*not found/i, hint: "Package not found on npm. Make sure you typed the command exactly: `npm install -g openclaw@latest`. Check your npm registry with `npm config get registry` — it should be https://registry.npmjs.org/" },
      // Generic npm error
      { pattern: /npm ERR!|npm error|npm warn.*peer/i, hint: "npm reported an error. Read the message carefully — it usually tells you what to fix. Common fixes: update npm with `npm install -g npm@latest`, or try `npm cache clean --force` then install again." },
      // Windows-specific
      { pattern: /not recognized as an internal or external command/i, hint: "npm is not recognized. Node.js may not be installed, or it's not in your PATH. Install Node from https://nodejs.org, then close and reopen your terminal." },
      // Already installed
      { pattern: /already installed|up to date|nothing to install/i, hint: "OpenClaw is already installed and up to date! Click Skip (already installed) to continue." },
    ],
    verify: [
      // Not installed or not in PATH
      { pattern: /command not found|not recognized|not an internal command|'openclaw' is not recognized/i, hint: "OpenClaw is not installed or not in your PATH. First, try closing your terminal and opening a new one — the PATH updates when you open a fresh terminal. If that doesn't work, reinstall: `npm install -g openclaw@latest`" },
      { pattern: /no such file or directory/i, hint: "OpenClaw binary not found. Try reinstalling: `npm install -g openclaw@latest`. If you see this on macOS, make sure /usr/local/bin is in your PATH: add `export PATH=\"/usr/local/bin:$PATH\"` to your ~/.zshrc or ~/.bashrc." },
      // Node issues
      { pattern: /node: command not found|'node'.*not found/i, hint: "Node.js issue. OpenClaw needs Node.js to run. Install Node 24 from https://nodejs.org, restart your terminal, then try again." },
      // Permission issues
      { pattern: /permission denied|access denied|eperm|eacces/i, hint: "Permission error running OpenClaw. Try: `npm install -g openclaw@latest` again, or run your terminal as Administrator." },
    ],
    onboard: [
      // Not installed
      { pattern: /command not found|not recognized|'openclaw' is not recognized/i, hint: "OpenClaw is not installed or not in PATH. Go back to Step 2 and install it first, or open a new terminal and try again." },
      // Already done
      { pattern: /workspace.*exists|already.*configured|already.*initialized|configuration.*found/i, hint: "Already configured! Your OpenClaw workspace is already set up. Click Skip to move on." },
      // API key issues
      { pattern: /api[_-]?key.*invalid|invalid.*api[_-]?key|authentication.*failed|unauthorized/i, hint: "Your API key was rejected. Double-check it in your provider dashboard (Anthropic, OpenAI, etc.) — make sure you copied the full key without spaces. Re-run `openclaw onboard --install-daemon` to enter it again." },
      { pattern: /api[_-]?key.*required|no.*api[_-]?key|api[_-]?key.*missing|enter.*api[_-]?key/i, hint: "An API key is needed. During `openclaw onboard --install-daemon`, you'll be prompted to choose a provider (Anthropic, OpenAI, Google, etc.) and enter your API key. Get one from your provider's website." },
      // Model/provider issues
      { pattern: /model.*not found|model.*not supported|invalid.*model|provider.*not.*supported/i, hint: "The selected model or provider isn't available. Re-run `openclaw onboard --install-daemon` and choose a different model. Make sure you have API access to it." },
      // Daemon/service install
      { pattern: /daemon.*failed|service.*failed|launchagent.*failed|systemd.*failed/i, hint: "Background service install failed. This is optional — the daemon just auto-starts OpenClaw. Try re-running without it: `openclaw onboard`. You can start it manually later with `openclaw dashboard`." },
      { pattern: /requires.*admin|administrator.*required|elevated.*required/i, hint: "Admin rights needed to install the background service. On Windows, run Terminal as Administrator. On macOS/Linux, run `sudo openclaw onboard --install-daemon`." },
      // User cancelled
      { pattern: /cancelled|aborted|user.*cancel|ctrl\+c|exit.*without/i, hint: "Onboarding was cancelled or interrupted. Run `openclaw onboard --install-daemon` again to complete setup. It only takes about 2 minutes." },
      // Permission errors
      { pattern: /permission denied|eperm|eacces|access denied/i, hint: "Permission denied. Try running as Administrator (Windows) or `sudo openclaw onboard --install-daemon` (macOS/Linux)." },
      // Success
      { pattern: /setup.*complete|onboarding.*complete|configured.*successfully|daemon.*installed|workspace.*created/i, hint: "Onboarding complete! Click Skip to proceed." },
    ],
    dashboard: [
      // Not installed
      { pattern: /command not found|not recognized|'openclaw' is not recognized/i, hint: "OpenClaw is not found. Open a fresh terminal window and try again. If it still fails, reinstall: `npm install -g openclaw@latest`" },
      // Not configured yet
      { pattern: /not.*configured|run.*onboard.*first|configuration.*missing|no.*config/i, hint: "OpenClaw isn't configured yet. Go back and run `openclaw onboard --install-daemon` first, then come back to this step." },
      // Port conflict — actually means it's already running, which is fine
      { pattern: /port.*18789.*in use|address.*already in use|eaddrinuse/i, hint: "Port 18789 is already in use — the dashboard is already running! Open your browser to http://127.0.0.1:18789/ and you're all set. Click Skip to finish." },
      // Dashboard already running — success
      { pattern: /already.*running|dashboard.*already|another.*instance/i, hint: "Dashboard is already running! Go to http://127.0.0.1:18789/ in your browser. Click Skip to finish." },
      // Successfully started
      { pattern: /listening.*18789|ready.*18789|server.*started|dashboard.*running|gateway.*started|running.*18789/i, hint: "Dashboard is running! Open http://127.0.0.1:18789/ in your browser. Click Skip to finish." },
      // API/auth issues
      { pattern: /api[_-]?key.*missing|provider.*not.*set|auth.*failed|no.*credentials/i, hint: "API key or provider not configured. Run `openclaw onboard --install-daemon` to set up your provider credentials, then try `openclaw dashboard` again." },
      // Config broken
      { pattern: /invalid.*config|config.*error|openclaw\.json.*error|parse.*error/i, hint: "Config file has an error. Try running `openclaw onboard --install-daemon` again to reconfigure, or manually edit ~/.openclaw/openclaw.json to fix any JSON syntax errors." },
      // Node.js issue
      { pattern: /node.*version|node: command not found|node.*not found/i, hint: "Node.js issue. Restart your terminal. If it persists, reinstall OpenClaw: `npm install -g openclaw@latest`" },
      // Crash/unexpected exit
      { pattern: /SIGINT|SIGTERM|killed|crashed|unexpected.*exit/i, hint: "The dashboard exited unexpectedly. Check the error message above. Try running `openclaw dashboard` again, or reinstall with `npm install -g openclaw@latest`." },
    ]
  };

  const SOFT_SUCCESS_PATTERNS = {
    install: [/already.*install|is already installed|up to date|nothing to install/i],
    verify: [],
    onboard: [/already.*configured|workspace.*already.*exist|already.*initialized/i],
    dashboard: [/already.*running|another.*instance.*running|port.*in use/i]
  };

  const SUCCESS_PATTERNS = {
    install: [/\+ openclaw@|added.*openclaw|openclaw.*\d+\.\d+\.\d+.*installed|successfully installed/i],
    verify: [/openclaw\s+\d+/i, /\d+\.\d+\.\d+/, /\bv\d+\.\d+/i],
    onboard: [/setup complete|onboarding.*complete|configured.*successfully|daemon.*installed|workspace.*created|configuration saved/i],
    dashboard: [/listening.*18789|ready.*18789|server.*started|dashboard.*running|gateway.*started|running.*18789/i]
  };

  function getOsKey() {
    const raw = `${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();
    if (raw.includes('win')) return 'windows';
    if (raw.includes('mac')) return 'macos';
    if (raw.includes('linux') || raw.includes('x11')) return 'linux';
    return 'linux'; // default fallback
  }

  function getOsLabel(key) {
    const labels = { windows: '🪟 Windows', macos: '🍎 macOS', linux: '🐧 Linux' };
    return labels[key] || '🐧 Linux';
  }

  function getCommands() {
    return INSTALL_COMMANDS[detectedOs] || INSTALL_COMMANDS.linux;
  }

  function $s(id) { return document.getElementById(id); }

  function setSetupHidden(id, hidden) {
    const el = typeof id === 'string' ? $s(id) : id;
    if (el) el.classList.toggle('hidden', Boolean(hidden));
  }

  function setSetupResult(id, text, kind) {
    const el = $s(id);
    if (!el) return;
    el.textContent = text;
    el.className = `inlineState ${kind} typewriter-text`.trim();
  }

  const SETUP_STEP_NUMBERS = { s1: 1, s2: 2, s3: 3, s4: 4, s5: 5, s6: 6 };

  function showSetupStep(stepId) {
    // Hide all setup steps
    SETUP_STEP_IDS.forEach(sid => {
      const el = document.querySelector(`.flowStep[data-step="${sid}"]`);
      if (el) { el.classList.remove('active'); el.classList.remove('exiting'); }
    });
    // Also hide main installer steps
    for (let i = 1; i <= 5; i++) {
      const el = document.querySelector(`.flowStep[data-step="${i}"]`);
      if (el) { el.classList.remove('active'); el.classList.remove('exiting'); }
    }
    // Show target
    const target = document.querySelector(`.flowStep[data-step="${stepId}"]`);
    if (target) target.classList.add('active');

    // Update header progress bar and label for setup steps
    const stepNum = SETUP_STEP_NUMBERS[stepId] || 1;
    const totalSetupSteps = 6;
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = `${((stepNum - 1) / (totalSetupSteps - 1)) * 100}%`;
    const stepLabel = document.getElementById('stepLabel');
    if (stepLabel) stepLabel.textContent = `Setup ${stepNum} / ${totalSetupSteps}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function checkOutput(output, stepKey) {
    const trimmed = (output || '').trim();
    if (!trimmed) {
      return { status: 'empty', message: 'No output pasted. Run the command and paste what you see in your terminal.' };
    }

    // Check soft-success patterns first (e.g. "already installed" is OK)
    const softPatterns = SOFT_SUCCESS_PATTERNS[stepKey] || [];
    for (const pattern of softPatterns) {
      if (pattern.test(trimmed)) {
        return { status: 'warning', message: 'Looks like this was already done! Moving on...' };
      }
    }

    // Check for known errors specific to this step
    const stepErrorList = STEP_ERRORS[stepKey] || [];
    for (const { pattern, hint } of stepErrorList) {
      if (pattern.test(trimmed)) {
        return { status: 'error', message: hint };
      }
    }

    // Fallback generic error scan
    for (const { pattern, hint } of STEP_ERRORS._fallback || []) {
      if (pattern.test(trimmed)) {
        return { status: 'error', message: hint };
      }
    }

    // Check for success patterns
    const successRegexes = SUCCESS_PATTERNS[stepKey] || [];
    let matched = 0;
    for (const regex of successRegexes) {
      if (regex.test(trimmed)) matched++;
    }

    if (matched > 0) {
      return { status: 'success', message: 'Looks good! Proceeding to the next step...' };
    }

    // If output exists but no clear pattern match — benefit of the doubt
    if (trimmed.length > 10) {
      return { status: 'success', message: 'Output received. Looks good! Moving on...' };
    }

    return { status: 'warning', message: 'Output seems short. Did you paste everything? If it worked, click Skip.' };
  }

  // Fallback error patterns — used when no step-specific match fires
  STEP_ERRORS._fallback = [
    { pattern: /error:|Error:|ERROR:|FAILED|fatal:/i, hint: "Something went wrong. Read the specific error message above — it usually tells you exactly what failed. Try running the command again in a fresh terminal. If the issue persists, click Skip if you believe the step completed successfully." },
    { pattern: /warn:|WARNING:|deprecated/i, hint: "There's a warning in the output, but it may not be a failure — warnings are often harmless. Check if the command completed after the warning. If so, click Skip to proceed." }
  ];

  function goToMainInstaller() {
    // Force-navigate to main step 1, clearing any active setup step first
    currentStep = 0;
    showStep(1);
    const stepLabel = document.getElementById('stepLabel');
    if (stepLabel) stepLabel.textContent = 'Step 1 / 5';
  }

  function bindSetupFlow() {
    // Helper: toggle doctor section open/closed
    function bindDoctorToggle(toggleId, sectionId) {
      const btn = $s(toggleId);
      const section = $s(sectionId);
      if (!btn || !section) return;
      btn.addEventListener('click', () => {
        const isHidden = section.classList.contains('hidden');
        section.classList.toggle('hidden', !isHidden);
        btn.textContent = isHidden ? 'Close Doctor ←' : 'Something went wrong? Open Doctor →';
      });
    }

    // Step 1: Welcome / OS Detection
    $s('setupStep1Next').addEventListener('click', () => {
      renderInstallStep();
      showSetupStep('s2');
    });

    // Step 2: Install OpenClaw
    $s('copyInstallCmd').addEventListener('click', async () => {
      await copyWithFeedback($s('copyInstallCmd'), getCommands().install);
    });
    $s('installContinueBtn').addEventListener('click', () => { showSetupStep('s3'); });
    bindDoctorToggle('installDoctorToggle', 'installDoctorSection');
    $s('installCheckBtn').addEventListener('click', () => {
      const output = $s('installOutput').value;
      const result = checkOutput(output, 'install');
      if (result.status === 'success' || result.status === 'warning') {
        setSetupResult('installCheckResult', `> ✓ ${result.message}`, 'success');
        setSetupHidden('installErrorBox', true);
        setTimeout(() => showSetupStep('s3'), 1200);
      } else {
        setSetupResult('installCheckResult', `> ✗ ${result.message}`, 'error');
        setSetupHidden('installErrorBox', false);
        $s('installErrorHint').textContent = result.message || 'Try running the command again or check your internet connection.';
      }
    });

    // Step 3: Verify
    $s('copyVerifyCmd').addEventListener('click', async () => {
      await copyWithFeedback($s('copyVerifyCmd'), getCommands().verify);
    });
    $s('verifyContinueBtn').addEventListener('click', () => { showSetupStep('s4'); });
    bindDoctorToggle('verifyDoctorToggle', 'verifyDoctorSection');
    $s('verifyCheckBtn').addEventListener('click', () => {
      const output = $s('verifyOutput').value;
      const result = checkOutput(output, 'verify');
      if (result.status === 'success' || result.status === 'warning') {
        setSetupResult('verifyCheckResult', `> ✓ ${result.message}`, 'success');
        setTimeout(() => showSetupStep('s4'), 1200);
      } else if (result.status === 'empty') {
        setSetupResult('verifyCheckResult', `> Paste the output of the command first.`, 'muted');
      } else {
        setSetupResult('verifyCheckResult', `> ✗ ${result.message}`, 'error');
      }
    });

    // Step 4: Onboard
    $s('copyOnboardCmd').addEventListener('click', async () => {
      await copyWithFeedback($s('copyOnboardCmd'), getCommands().onboard);
    });
    $s('onboardContinueBtn').addEventListener('click', () => { showSetupStep('s5'); });
    bindDoctorToggle('onboardDoctorToggle', 'onboardDoctorSection');
    $s('onboardCheckBtn').addEventListener('click', () => {
      const output = $s('onboardOutput').value;
      const result = checkOutput(output, 'onboard');
      if (result.status === 'success' || result.status === 'warning') {
        setSetupResult('onboardCheckResult', `> ✓ ${result.message}`, 'success');
        setTimeout(() => showSetupStep('s5'), 1200);
      } else {
        setSetupResult('onboardCheckResult', `> ✗ ${result.message}`, 'error');
      }
    });

    // Step 5: Dashboard
    $s('copyDashboardCmd').addEventListener('click', async () => {
      await copyWithFeedback($s('copyDashboardCmd'), getCommands().dashboard);
    });
    $s('dashboardContinueBtn').addEventListener('click', () => { showSetupStep('s6'); });
    bindDoctorToggle('dashboardDoctorToggle', 'dashboardDoctorSection');
    $s('dashboardCheckBtn').addEventListener('click', () => {
      const output = $s('dashboardOutput').value;
      const result = checkOutput(output, 'dashboard');
      if (result.status === 'success' || result.status === 'warning') {
        setSetupResult('dashboardCheckResult', `> ✓ ${result.message}`, 'success');
        setTimeout(() => showSetupStep('s6'), 1200);
      } else {
        setSetupResult('dashboardCheckResult', `> ✗ ${result.message}`, 'error');
      }
    });

    // Step 6: Done
    $s('gotoInstallerBtn').addEventListener('click', (e) => {
      e.preventDefault();
      goToMainInstaller();
    });
  }

  function renderInstallStep() {
    const cmds = getCommands();
    const stepIds = [
      { cmd: 'install', profile: 'setupInstallProfile', command: 'setupInstallCommand' },
      { cmd: 'verify', profile: 'setupVerifyProfile', command: 'setupVerifyCommand' },
      { cmd: 'onboard', profile: 'setupOnboardProfile', command: 'setupOnboardCommand' },
      { cmd: 'dashboard', profile: 'setupDashboardProfile', command: 'setupDashboardCommand' }
    ];
    for (const { cmd, profile, command } of stepIds) {
      setText(profile, cmds.terminalName);
      setText(command, cmds[cmd]);
    }
  }

  // ── Download button handlers ──
  const DOWNLOADS = {
    sh: { primary: 'https://elitza.life/scripts/install-elitza.sh', fallback: 'https://raw.githubusercontent.com/dario-cositore/elitza.life/main/scripts/install-elitza.sh' },
    bat: { primary: 'https://elitza.life/scripts/install-elitza.bat', fallback: 'https://raw.githubusercontent.com/dario-cositore/elitza.life/main/scripts/install-elitza.bat' },
    ps1: { primary: 'https://elitza.life/scripts/install-elitza.ps1', fallback: 'https://raw.githubusercontent.com/dario-cositore/elitza.life/main/scripts/install-elitza.ps1' }
  };
  function downloadScript(key) { window.open(DOWNLOADS[key].primary, '_blank'); }
  $s('dlLinuxMac').addEventListener('click', () => downloadScript('sh'));
  $s('dlWindows').addEventListener('click', () => downloadScript('bat'));
  $s('dlWindowsPS').addEventListener('click', () => downloadScript('ps1'));

  function init() {
    detectedOs = getOsKey();
    $s('detectedOs').textContent = `${getOsLabel(detectedOs)} — ${INSTALL_COMMANDS[detectedOs].label}`;
    $s('setupTerminalInstructions').innerHTML = INSTALL_COMMANDS[detectedOs].terminalHelp;
    setSetupHidden('setupTerminalInstructions', false);
    // Actually show the terminal help box
    setSetupHidden('setupTerminalHelp', false);

    // Expose showSetupStep globally for cross-module navigation
    window._showSetupStep = showSetupStep;

    // Bind "Setup OpenClaw First" button on welcome screen
    $s('setupOpenClawBtn').addEventListener('click', () => {
      renderInstallStep(); // Pre-render all setup commands so S2-S5 are ready before they animate in
      showSetupStep('s1');
    });

    bindSetupFlow();
  }

  return { init };
})();

// Boot
init();
SetupGuide.init();
