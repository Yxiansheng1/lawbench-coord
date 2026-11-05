import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = path.join(HERE, "runs");
const SERVER = path.join(HERE, "server.py");
const API_SESSION = "22222222-2222-4222-8222-222222222222";
const UNKNOWN_CASE = "00000000-0000-4000-8000-000000000000";
const V1_BYTES = 54;
const V1_SHA256 =
  "cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae";
const V2_CONTENT =
  "# T32 synthetic draft\n\nSynthetic revision for local UI save.\n";
const V2_BYTES = 61;
const V2_SHA256 =
  "7d090ef6fbda9e38b17f1befe5e1c4a2bb8f6db2c2bf45031eb70e52e19a22cc";
const ROUTES = [
  ["GET", "/api/capsules"],
  ["GET", "/api/case/recent"],
  ["GET", "/api/materials"],
  ["GET", "/api/ocr/jobs"],
  ["GET", "/api/outputs"],
  ["GET", "/api/settings"],
  ["GET", "/api/task/current"],
  ["GET", "/api/tasks"],
  ["GET", "/api/wiki/review"],
  ["GET", "/api/wiki/suggestions"],
  ["GET", "/health"],
  ["POST", "/api/case/open"],
  ["POST", "/api/documents/save"],
  ["POST", "/core/task/begin"],
  ["POST", "/core/task/end"],
  ["POST", "/core/tool"],
];
const BOOTSTRAP_PATHS = [
  "/api/case/open",
  "/core/task/begin",
  "/core/tool",
  "/core/task/end",
];

function fail(message) {
  throw new Error(message);
}

function check(condition, message) {
  if (!condition) fail(message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function same(left, right) {
  return stable(left) === stable(right);
}

function readFile(file) {
  const info = fs.lstatSync(file);
  check(info.isFile() && !info.isSymbolicLink(), `not a plain file: ${file}`);
  return fs.readFileSync(file);
}

function readJson(file) {
  try {
    return JSON.parse(readFile(file).toString("utf8"));
  } catch (error) {
    fail(`cannot read JSON ${file}: ${error.message}`);
  }
}

function readNdjson(file) {
  return readFile(file)
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function casePath(caseRoot, relative) {
  check(
    typeof relative === "string" &&
      relative.length > 0 &&
      !relative.includes("\\"),
    "invalid native relative path",
  );
  const parts = relative.split("/");
  check(
    parts.every((part) => part.length > 0 && part !== "." && part !== ".."),
    "unsafe native relative path",
  );
  return path.join(caseRoot, ...parts);
}

function walk(value, visit) {
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) walk(item, visit);
  }
}

function taskObjects(value) {
  const found = [];
  walk(value, (item) => {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.task_id === "string"
    ) {
      found.push(item);
    }
  });
  return found;
}

function draftObjects(value) {
  const found = new Map();
  walk(value, (item) => {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.path === "string" &&
      Number.isInteger(item.version) &&
      /-v[0-9]+\.md$/.test(item.path)
    ) {
      found.set(stable(item), item);
    }
  });
  return [...found.values()];
}

function validateTasks(value, taskId, versions) {
  const taskIds = new Set(taskObjects(value).map((item) => item.task_id));
  check(taskIds.size === 1 && taskIds.has(taskId), "tasks response identity");
  const drafts = draftObjects(value);
  check(
    drafts.length === versions.length &&
      same(
        drafts.map((item) => item.version).sort((a, b) => a - b),
        versions,
      ),
    "tasks response draft set",
  );
  check(
    drafts.every((item) => item.path === item.path.replace(/\\/g, "/")),
    "tasks response draft path",
  );
  const scalarStrings = [];
  walk(value, (item) => {
    if (typeof item === "string") scalarStrings.push(item);
  });
  check(scalarStrings.includes("cancelled"), "tasks response cancelled state");
  return drafts;
}

function requiredEnv(name) {
  const value = process.env[name];
  check(typeof value === "string" && value.length > 0, `missing ${name}`);
  return value;
}

const rawRoot = requiredEnv("LB_NATIVE_GUI_ROOT");
const rawPort = requiredEnv("LB_NATIVE_GUI_PORT");
const token = requiredEnv("LB_NATIVE_GUI_TOKEN");
const root = path.resolve(rawRoot);
const runs = path.resolve(RUNS);
const port = Number(rawPort);

check(
  path.dirname(root).toLowerCase() === runs.toLowerCase(),
  "LB_NATIVE_GUI_ROOT must be a direct child of this fixture's runs",
);
check(/^T33-host-[0-9]{8}-[0-9]{6}$/.test(path.basename(root)), "run name");
check(fs.existsSync(root), "LB_NATIVE_GUI_ROOT does not exist");
check(/^[0-9]+$/.test(rawPort), "LB_NATIVE_GUI_PORT format");
check(
  Number.isInteger(port) &&
    port >= 1024 &&
    port <= 65535 &&
    !(port >= 65001 && port <= 65005),
  "LB_NATIVE_GUI_PORT range",
);
check(/^[0-9a-f]{64}$/.test(token), "LB_NATIVE_GUI_TOKEN format");

const prepared = readJson(path.join(root, "prepared.json"));
const started = readJson(path.join(root, "started.json"));
const report = readJson(path.join(root, "bootstrap-report.json"));
const ready = readJson(path.join(root, "ready.json"));
const caseRoot = prepared.paths?.case?.path;

check(
  prepared.expected_head === "dc56a93be4b07dbe7a48863e3135351659817fb5",
  "prepared HEAD",
);
check(
  path.resolve(prepared.paths?.root?.path || "") === root,
  "prepared root",
);
check(caseRoot && path.isAbsolute(caseRoot), "prepared case root");
check(started.root === root, "started root");
check(started.host_port === port, "started port");
check(ready.port === port && ready.host === "127.0.0.1", "ready listener");
check(ready.expected_head === prepared.expected_head, "ready HEAD");
check(ready.pid === started.pid, "server PID continuity");
check(
  ready.started_at && Date.parse(ready.started_at) >= Date.parse(report.finished_at),
  "bootstrap completed before ready",
);
check(
  Date.parse(report.started_at) <= Date.parse(report.finished_at),
  "bootstrap time order",
);

const sourcePin = prepared.source?.["entry/server.py"];
const serverBytes = readFile(SERVER);
check(
  sourcePin?.sha256 === sha256(serverBytes) &&
    sourcePin?.bytes === serverBytes.length,
  "entry source pin",
);

check(report.transport === "ASGI-inprocess-no-socket", "bootstrap transport");
check(report.native_call_count === 4, "bootstrap call count");
check(
  same(
    report.native_calls.map((item) => [item.method, item.path, item.status]),
    BOOTSTRAP_PATHS.map((item) => ["POST", item, 200]),
  ),
  "bootstrap native calls",
);
check(
  same(report.usage, { model_calls: 0, tool_calls: 1, elapsed_s: 0 }),
  "bootstrap usage",
);
check(
  report.task_state === "finished" &&
    report.result_status === "cancelled" &&
    report.v1_preserved_for_gui === true &&
    report.not_true_http_or_gui_proof === true,
  "bootstrap result markers",
);
check(
  /^T-[0-9]{14}-[0-9a-f]{4}$/.test(report.task_id),
  "bootstrap task id",
);
check(report.v1_bytes === V1_BYTES, "bootstrap v1 bytes");
check(report.v1_sha256 === V1_SHA256, "bootstrap v1 hash");
check(
  !Object.prototype.hasOwnProperty.call(report, "content") &&
    !Object.prototype.hasOwnProperty.call(report, "token"),
  "bootstrap report metadata only",
);

const taskBase = path.join(caseRoot, "工作区", "任务");
const taskFolders = fs.readdirSync(taskBase, { withFileTypes: true });
check(
  taskFolders.length === 1 &&
    taskFolders[0].name === report.task_id &&
    taskFolders[0].isDirectory(),
  "one owned task directory",
);
const taskDir = path.join(taskBase, report.task_id);
const taskFiles = new Set(fs.readdirSync(taskDir));
check(
  same([...taskFiles].sort(), ["task.json", "result.json", "reads.json", "草稿"].sort()),
  "task directory file set",
);
const task = readJson(path.join(taskDir, "task.json"));
const result = readJson(path.join(taskDir, "result.json"));
const reads = readJson(path.join(taskDir, "reads.json"));
check(
  task.task_id === report.task_id &&
    task.case_id === report.case_id &&
    task.session_id === "11111111-1111-4111-8111-111111111111" &&
    task.kind === "agent" &&
    task.route === "local" &&
    task.skill === null &&
    task.state === "finished",
  "actual native task",
);
check(
  result.task_id === report.task_id &&
    result.status === "cancelled" &&
    result.usage?.model_calls === 0 &&
    result.usage?.tool_calls === 1 &&
    result.usage?.elapsed_s === 0 &&
    result.finished_at !== null &&
    Array.isArray(result.drafts) &&
    result.drafts.length === 1 &&
    result.drafts[0].version === 1 &&
    result.drafts[0].path === report.v1_relative,
  "actual native result",
);
check(
  reads.task_id === report.task_id &&
    Array.isArray(reads.reads) &&
    reads.reads.length === 0,
  "actual native reads",
);

const draftDir = path.join(taskDir, "草稿");
const draftNames = fs.readdirSync(draftDir);
check(draftNames.length === 1, "one native v1 before GUI save");
const v1Path = casePath(caseRoot, report.v1_relative);
const v1Before = readFile(v1Path);
check(
  v1Before.length === V1_BYTES && sha256(v1Before) === V1_SHA256,
  "native v1 identity",
);

const registry = readJson(
  path.join(root, "private", "appdata", "cases.json"),
);
check(
  registry.v === 1 &&
    Array.isArray(registry.cases) &&
    registry.cases.length === 1 &&
    registry.cases[0].case_id === report.case_id &&
    path.resolve(registry.cases[0].root) === path.resolve(caseRoot),
  "owned case registry",
);

const apiBase = `http://127.0.0.1:${port}`;
const authHeaders = { Authorization: `Bearer ${token}` };

async function request(method, pathname, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const headers = { ...authHeaders };
  const init = { method, headers, redirect: "error", signal: controller.signal };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(apiBase + pathname, init);
  } finally {
    clearTimeout(timer);
  }
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { status: response.status, json };
}

async function expectOk(method, pathname, body) {
  const response = await request(method, pathname, body);
  check(response.status === 200, `${method} ${pathname} expected 200`);
  if (pathname === "/health") {
    check(
      response.json &&
        response.json.status === "ok" &&
        response.json.contract_version === "1.6",
      `${method} ${pathname} health response envelope`,
    );
    return response.json;
  }
  const hasValue =
    response.json &&
    Object.prototype.hasOwnProperty.call(response.json, "value");
  check(
    response.json &&
      response.json.ok === true &&
      hasValue,
    `${method} ${pathname} response envelope`,
  );
  return response.json.value;
}

async function expectStatus(method, pathname, body, status) {
  const response = await request(method, pathname, body);
  check(
    response.status === status,
    `${method} ${pathname} expected ${status}`,
  );
  return response.json;
}

const reopen = await expectOk("POST", "/api/case/open", {
  path: caseRoot,
  template: null,
});
check(reopen.case_id === report.case_id, "GUI case reopen identity");

const caseQuery = `case_id=${encodeURIComponent(report.case_id)}`;
const readChecks = [
  "/health",
  "/api/case/recent",
  "/api/settings",
  "/api/capsules",
  `/api/materials?${caseQuery}`,
  `/api/tasks?${caseQuery}`,
  `/api/outputs?${caseQuery}`,
  `/api/ocr/jobs?${caseQuery}`,
  `/api/wiki/suggestions?${caseQuery}`,
  `/api/wiki/review?${caseQuery}`,
];
for (const pathname of readChecks) {
  await expectOk("GET", pathname);
}
const tasksBefore = await expectOk("GET", `/api/tasks?${caseQuery}`);
validateTasks(tasksBefore, report.task_id, [1]);
const current = await expectOk(
  "GET",
  `/api/task/current?session_id=${encodeURIComponent(API_SESSION)}`,
);
check(
  same(current, { selection: null }),
  "GUI current task selection must be null for UI session",
);

await expectStatus(
  "GET",
  `/api/tasks?case_id=${encodeURIComponent(UNKNOWN_CASE)}`,
  undefined,
  403,
);
await expectStatus(
  "POST",
  "/core/task/begin",
  { session_id: "11111111-1111-4111-8111-111111111111", cwd: caseRoot },
  403,
);
await expectStatus(
  "POST",
  "/core/tool",
  {
    task_id: report.task_id,
    tool: "case_save_draft",
    args: {
      title: "T32SyntheticDraft",
      content:
        "# T32 synthetic draft\n\nSynthetic local document only.\n",
    },
  },
  403,
);
await expectStatus("POST", "/core/progress", {}, 403);
await expectStatus("PUT", "/api/settings", {}, 403);

const expectedV2Relative = report.v1_relative.replace(/-v1\.md$/, "-v2.md");
check(
  expectedV2Relative !== report.v1_relative,
  "v1 draft path shape",
);
const saved = await expectOk("POST", "/api/documents/save", {
  case_id: report.case_id,
  path: report.v1_relative,
  content: V2_CONTENT,
});
check(
  saved.task_id === report.task_id &&
    saved.path === expectedV2Relative &&
    saved.version === 2,
  "native v2 save response",
);
const v2Path = casePath(caseRoot, saved.path);
const v2Bytes = readFile(v2Path);
check(
  v2Bytes.length === V2_BYTES &&
    sha256(v2Bytes) === V2_SHA256 &&
    v2Bytes.toString("utf8") === V2_CONTENT,
  "native v2 identity",
);
check(
  sha256(readFile(v1Path)) === V1_SHA256,
  "native v1 preserved after save",
);
const resultAfterSave = readJson(path.join(taskDir, "result.json"));
check(
  resultAfterSave.drafts.length === 2 &&
    resultAfterSave.drafts[0].path === report.v1_relative &&
    resultAfterSave.drafts[0].version === 1 &&
    resultAfterSave.drafts[1].path === saved.path &&
    resultAfterSave.drafts[1].version === 2,
  "registered v1/v2 metadata",
);
await expectStatus(
  "POST",
  "/api/documents/save",
  {
    case_id: report.case_id,
    path: report.v1_relative,
    content: V2_CONTENT,
  },
  403,
);
const tasksAfter = await expectOk("GET", `/api/tasks?${caseQuery}`);
validateTasks(tasksAfter, report.task_id, [1, 2]);

const ledgerInitial = readNdjson(path.join(root, "requests.ndjson"));
check(ledgerInitial.length >= 5, "native TCP request ledger exists");
for (let index = 0; index < BOOTSTRAP_PATHS.length; index += 1) {
  const entry = ledgerInitial[index];
  check(
    entry.method === "POST" &&
      entry.path === BOOTSTRAP_PATHS[index] &&
      entry.status === 200 &&
      entry.disposition === "native_app",
    `bootstrap ledger entry ${index + 1}`,
  );
}
check(
  ledgerInitial[4].method === "POST" &&
    ledgerInitial[4].path === "/api/case/open" &&
    ledgerInitial[4].status === 200,
  "TCP ledger starts after ready",
);

async function waitForNaturalClose() {
  const finalPath = path.join(root, "final-metadata.json");
  const loopPath = path.join(root, "loop-closed.json");
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(finalPath) && fs.existsSync(loopPath)) return;
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (fs.existsSync(finalPath) && fs.existsSync(loopPath)) return;
  fail("natural close evidence timeout");
}

await waitForNaturalClose();
const final = readJson(path.join(root, "final-metadata.json"));
const loop = readJson(path.join(root, "loop-closed.json"));
check(
  !fs.existsSync(path.join(root, "run-error.json")),
  "unexpected run-error",
);
check(
  final.outcome === "COMPLETED_FOR_ROOT_REVIEW" &&
    final.failure_code === null,
  "server natural outcome",
);
check(final.root === root && final.requested_seconds === 20, "final root/run");
check(final.source_unchanged === true, "source unchanged");
check(same(final.source_before, final.source_after), "source snapshots");
check(
  sourcePin.sha256 === final.source_after["entry/server.py"].sha256,
  "final entry source pin",
);
check(
  final.fixture_source_unchanged === true,
  "fixture source unchanged",
);
check(
  same(final.credentials, {
    local_getter_calls: 0,
    external_getter_calls: 0,
    keyring_rejections: 0,
  }),
  "zero credential getters",
);
check(
  final.guard?.unexpected_outbound_violations === 0 &&
    Array.isArray(final.guard.violations) &&
    final.guard.violations.length === 0,
  "guard no outbound or violation",
);
check(
  final.cleanup?.server_should_exit === true &&
    final.cleanup?.server_task_done === true &&
    final.cleanup?.listener_closed === true &&
    final.cleanup?.net_client_closed === true &&
    final.cleanup?.product_logs_closed === true,
  "natural cleanup",
);
check(
  final.lifecycle?.ocr_threads === 0 &&
    final.lifecycle?.ocr_start_called === false &&
    final.lifecycle?.ocr_stop_called === false &&
    final.lifecycle?.retainer_process_started === false &&
    final.lifecycle?.retainer_close_called === false &&
    final.lifecycle?.product_lifespan_started === false,
  "OCR/lifespan/Retainer off",
);
check(
  final.native_app?.lifespan === "off" &&
    final.native_app?.auth === "native middleware",
  "native app lifecycle/auth",
);
check(
  final.listener?.ipv4_only === true &&
    final.listener?.websocket === false &&
    final.listener?.forward_listener === false,
  "listener boundary",
);
check(
  loop.event_loop_closed === true &&
    loop.final_metadata_written === true &&
    Date.parse(loop.closed_at) >= Date.parse(final.finished_at),
  "event loop close",
);
check(
  same(
    final.native_app.allowed_routes
      .map((item) => item.join(" "))
      .sort(),
    ROUTES.map((item) => item.join(" ")).sort(),
  ),
  "exact reviewed route union",
);
check(same(final.requests, ledgerInitial), "final request ledger");

const settings = readJson(
  path.join(root, "private", "appdata", "settings.json"),
);
check(
  settings.external_llm?.enabled === false &&
    settings.external_llm?.base_url === null,
  "external model off",
);
for (const file of [
  path.join(root, "prepared.json"),
  path.join(root, "started.json"),
  path.join(root, "bootstrap-report.json"),
  path.join(root, "ready.json"),
  path.join(root, "requests.ndjson"),
  path.join(root, "final-metadata.json"),
  path.join(root, "loop-closed.json"),
  path.join(root, "private", "appdata", "settings.json"),
]) {
  check(!readFile(file).toString("utf8").includes(token), "credential leak");
}
if (final.service_log && fs.existsSync(final.service_log)) {
  check(
    !readFile(final.service_log).toString("utf8").includes(token),
    "service log credential leak",
  );
}

console.log(
  `PASS T32 native GUI draft entry fixture (${report.task_id}, ${final.outcome})`,
);
