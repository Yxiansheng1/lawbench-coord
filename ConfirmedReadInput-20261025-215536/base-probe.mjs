import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = path.join(HERE, "runs");
const SERVER = path.join(HERE, "server.py");
const API_SESSION = "22222222-2222-4222-8222-222222222222";
const UNKNOWN_CASE = "00000000-0000-4000-8000-000000000000";
const OTHER_TASK = "T-20000101000000-dead";
const V1_BYTES = 54;
const V1_SHA256 =
  "cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae";
const OUTPUT_REL = "成果/T32SyntheticDraft-v1.md";
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
  ["POST", "/api/outputs/confirm"],
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
  check(
    info.isFile() &&
      !info.isSymbolicLink() &&
      info.nlink === 1,
    `not a plain nlink-1 file: ${file}`,
  );
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
  const full = path.resolve(caseRoot, ...parts);
  check(
    full.startsWith(path.resolve(caseRoot) + path.sep),
    "native path escaped case",
  );
  return full;
}

function taskObjects(value) {
  const found = [];
  const visit = (item) => {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof item.task_id === "string"
    ) {
      found.push(item);
    }
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
    } else if (item && typeof item === "object") {
      for (const child of Object.values(item)) visit(child);
    }
  };
  visit(value);
  return found;
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

const preparedPath = path.join(root, "prepared.json");
const startedPath = path.join(root, "started.json");
const reportPath = path.join(root, "bootstrap-report.json");
const readyPath = path.join(root, "ready.json");
const prepared = readJson(preparedPath);
const started = readJson(startedPath);
const report = readJson(reportPath);
const ready = readJson(readyPath);
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
check(path.resolve(started.root || "") === root, "started root");
check(started.host_port === port, "started port");
check(started.pid === ready.pid, "server PID continuity");
check(ready.port === port && ready.host === "127.0.0.1", "ready listener");
check(ready.expected_head === prepared.expected_head, "ready HEAD");
check(ready.appdata === started.appdata, "ready appdata continuity");
check(ready.case_path === caseRoot, "ready case continuity");
check(ready.paste_path === started.paste_path, "ready paste continuity");
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
check(
  started.prepared_sha256 === sha256(readFile(preparedPath)) &&
    ready.prepared_sha256 === started.prepared_sha256,
  "prepared manifest identity",
);
check(
  same(ready.source_sha256, prepared.source) &&
    same(ready.source_sha256, prepared.source),
  "ready source pin",
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
const taskPath = path.join(taskDir, "task.json");
const resultPath = path.join(taskDir, "result.json");
const readsPath = path.join(taskDir, "reads.json");
const task = readJson(taskPath);
const result = readJson(resultPath);
const reads = readJson(readsPath);
check(
  task.task_id === report.task_id &&
    task.case_id === report.case_id &&
    task.session_id === "11111111-1111-4111-8111-111111111111" &&
    task.kind === "agent" &&
    task.route === "local" &&
    task.skill === null &&
    task.state === "finished" &&
    Array.isArray(task.inputs),
  "actual native task",
);
check(
  result.task_id === report.task_id &&
    result.status === "cancelled" &&
    result.usage?.model_calls === 0 &&
    result.usage?.tool_calls === 1 &&
    result.usage?.elapsed_s === 0 &&
    result.finished_at !== null &&
    result.citation_check?.passed === true &&
    result.citation_check?.problems?.length === 0 &&
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
check(draftNames.length === 1, "one native v1 before confirmation");
const v1Path = casePath(caseRoot, report.v1_relative);
const v1Before = readFile(v1Path);
check(
  v1Before.length === V1_BYTES && sha256(v1Before) === V1_SHA256,
  "native v1 identity",
);

const registry = readJson(path.join(root, "private", "appdata", "cases.json"));
check(
  registry.v === 1 &&
    Array.isArray(registry.cases) &&
    registry.cases.length === 1 &&
    registry.cases[0].case_id === report.case_id &&
    path.resolve(registry.cases[0].root) === path.resolve(caseRoot),
  "owned case registry",
);

function fileSnapshot(file) {
  const info = fs.lstatSync(file);
  check(
    info.isFile() && !info.isSymbolicLink() && info.nlink === 1,
    `not a plain nlink-1 file: ${file}`,
  );
  return {
    path: file,
    bytes: info.size,
    mtimeMs: info.mtimeMs,
    sha256: sha256(fs.readFileSync(file)),
  };
}

function sourceState() {
  return {
    task: fileSnapshot(taskPath),
    result: fileSnapshot(resultPath),
    reads: fileSnapshot(readsPath),
    v1: fileSnapshot(v1Path),
  };
}

const sourceBefore = sourceState();
const outputRoot = path.join(caseRoot, "成果");

function outputState() {
  if (!fs.existsSync(outputRoot)) return { exists: false, names: [] };
  const info = fs.lstatSync(outputRoot);
  check(info.isDirectory() && !info.isSymbolicLink(), "output root is not plain");
  return { exists: true, names: fs.readdirSync(outputRoot).sort() };
}

function expectOutputsEmpty() {
  const state = outputState();
  check(!state.exists || state.names.length === 0, "outputs not empty");
}

function expectSourcesUnchanged() {
  check(same(sourceState(), sourceBefore), "native source changed");
  expectOutputsEmpty();
}

expectOutputsEmpty();

const apiBase = `http://127.0.0.1:${port}`;
const goodAuth = `Bearer ${token}`;
let tcpCount = 0;

function request(method, pathname, body, authorization = [goodAuth]) {
  const payload =
    body === undefined ? null : Buffer.from(JSON.stringify(body), "utf8");
  const headers = {};
  if (payload) {
    headers["Content-Type"] = "application/json";
    headers["Content-Length"] = String(payload.length);
  }
  tcpCount += 1;
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: pathname,
        method,
        headers,
        agent: false,
      },
      (response) => {
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          if (text) {
            try {
              json = JSON.parse(text);
            } catch {
              json = null;
            }
          }
          resolve({ status: response.statusCode, json });
        });
      },
    );
    req.setTimeout(5000, () => req.destroy(new Error("HTTP request timeout")));
    req.on("error", reject);
    if (authorization !== null) {
      req.setHeader("Authorization", authorization);
    }
    req.end(payload);
  });
}

async function expectOk(method, pathname, body) {
  const response = await request(method, pathname, body);
  check(response.status === 200, `${method} ${pathname} expected 200`);
  if (pathname === "/health") {
    check(
      response.json &&
        response.json.status === "ok" &&
        response.json.contract_version === "1.6",
      `${method} ${pathname} health response`,
    );
    return response.json;
  }
  check(
    response.json &&
      response.json.ok === true &&
      Object.prototype.hasOwnProperty.call(response.json, "value"),
    `${method} ${pathname} response envelope`,
  );
  return response.json.value;
}

async function expectStatus(
  method,
  pathname,
  body,
  status,
  authorization = [goodAuth],
) {
  const response = await request(method, pathname, body, authorization);
  check(
    response.status === status,
    `${method} ${pathname} expected ${status}, got ${response.status}`,
  );
  return response.json;
}

await expectOk("GET", "/health");
const current = await expectOk(
  "GET",
  `/api/task/current?session_id=${encodeURIComponent(API_SESSION)}`,
);
check(same(current, { selection: null }), "GUI current task must be empty");
const outputsBefore = await expectOk(
  "GET",
  `/api/outputs?case_id=${encodeURIComponent(report.case_id)}`,
);
check(
  outputsBefore &&
    same(Object.keys(outputsBefore).sort(), ["outputs", "v"]) &&
    outputsBefore.v === 1 &&
    Array.isArray(outputsBefore.outputs) &&
    outputsBefore.outputs.length === 0,
  "GUI outputs must be empty before confirmation",
);

const baseConfirm = {
  case_id: report.case_id,
  task_id: report.task_id,
  draft: report.v1_relative,
  formats: ["md"],
  template: null,
};
const negatives = [
  ["POST", "/api/outputs/confirm", baseConfirm, 401, null],
  [
    "POST",
    "/api/outputs/confirm",
    baseConfirm,
    401,
    [`Bearer ${"0".repeat(64)}`],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    baseConfirm,
    401,
    [`Bearer ${"0".repeat(64)}`, goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    baseConfirm,
    401,
    [goodAuth, `Bearer ${"0".repeat(64)}`],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    { ...baseConfirm, extra: true },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    { ...baseConfirm, case_id: UNKNOWN_CASE },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    { ...baseConfirm, task_id: OTHER_TASK },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    {
      ...baseConfirm,
      draft: report.v1_relative.replace(/-v1\.md$/, "-v2.md"),
    },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    {
      ...baseConfirm,
      draft: `工作区/任务/${OTHER_TASK}/草稿/T32SyntheticDraft-v1.md`,
    },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    { ...baseConfirm, formats: ["docx"] },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/outputs/confirm",
    { ...baseConfirm, template: "文书" },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/api/documents/save",
    { case_id: report.case_id, path: report.v1_relative, content: "" },
    403,
    [goodAuth],
  ],
  [
    "POST",
    "/core/tool",
    {
      task_id: report.task_id,
      tool: "case_save_draft",
      args: {
        title: "T32SyntheticDraft",
        content: "# T32 synthetic draft\n\nSynthetic local document only.\n",
      },
    },
    403,
    [goodAuth],
  ],
];

for (const [method, pathname, body, status, authorization] of negatives) {
  await expectStatus(method, pathname, body, status, authorization);
  expectSourcesUnchanged();
}

const confirmation = await request(
  "POST",
  "/api/outputs/confirm",
  baseConfirm,
);
check(confirmation.status === 200, "valid confirmation expected 200");
check(
  confirmation.json &&
    same(Object.keys(confirmation.json).sort(), ["ok", "value"]) &&
    confirmation.json.ok === true &&
    same(Object.keys(confirmation.json.value || {}), ["outputs"]) &&
    Array.isArray(confirmation.json.value.outputs) &&
    confirmation.json.value.outputs.length === 1,
  "valid confirmation response shape",
);
const confirmedOutput = confirmation.json.value.outputs[0];
check(
  same(Object.keys(confirmedOutput).sort(), ["format", "path", "version"]) &&
    confirmedOutput.format === "md" &&
    confirmedOutput.path === OUTPUT_REL &&
    confirmedOutput.version === 1,
  "valid confirmation output",
);
check(same(sourceState(), sourceBefore), "confirmation changed native sources");

const outputAfter = outputState();
check(
  outputAfter.exists &&
    same(outputAfter.names, ["T32SyntheticDraft-v1.md", "索引.json"].sort()),
  "confirmed output directory membership",
);
const outputPath = casePath(caseRoot, OUTPUT_REL);
const indexPath = path.join(outputRoot, "索引.json");
const outputBytes = readFile(outputPath);
const indexBytes = readFile(indexPath);
check(
  outputBytes.length === V1_BYTES &&
    outputBytes.length === v1Before.length &&
    sha256(outputBytes) === V1_SHA256 &&
    outputBytes.equals(v1Before),
  "confirmed markdown identity",
);

let index;
try {
  index = JSON.parse(indexBytes.toString("utf8"));
} catch {
  fail("outputs index is not valid JSON");
}
check(
  same(Object.keys(index).sort(), ["outputs", "v"]) &&
    index.v === 1 &&
    Array.isArray(index.outputs) &&
    index.outputs.length === 1,
  "outputs index root",
);
const entry = index.outputs[0];
const entryKeys = [
  "citation_passed",
  "confirmed_at",
  "draft",
  "files",
  "inputs",
  "task_id",
  "title",
  "version",
];
check(
  same(Object.keys(entry).sort(), entryKeys.sort()) &&
    entry.title === "T32SyntheticDraft" &&
    entry.version === 1 &&
    entry.task_id === report.task_id &&
    same(entry.inputs, task.inputs) &&
    entry.citation_passed === true &&
    typeof entry.confirmed_at === "string" &&
    entry.confirmed_at.length > 0 &&
    Number.isFinite(Date.parse(entry.confirmed_at)) &&
    entry.draft === report.v1_relative &&
    Array.isArray(entry.files) &&
    entry.files.length === 1 &&
    same(entry.files[0], { format: "md", path: OUTPUT_REL }),
  "outputs index contract and source identity",
);

const afterConfirmState = sourceState();
check(same(afterConfirmState, sourceBefore), "confirmed source identity");
const outputsAfterConfirm = await expectOk(
  "GET",
  `/api/outputs?case_id=${encodeURIComponent(report.case_id)}`,
);
check(
  outputsAfterConfirm &&
    Array.isArray(outputsAfterConfirm.outputs) &&
    outputsAfterConfirm.outputs.length === 1 &&
    same(outputsAfterConfirm.outputs[0], entry),
  "GET outputs after confirmation",
);
const confirmedFiles = {
  output: fileSnapshot(outputPath),
  index: fileSnapshot(indexPath),
};

await expectStatus(
  "POST",
  "/api/outputs/confirm",
  baseConfirm,
  403,
  [goodAuth],
);
check(
  same(sourceState(), sourceBefore) &&
    same(fileSnapshot(outputPath), confirmedFiles.output) &&
    same(fileSnapshot(indexPath), confirmedFiles.index),
  "repeat confirmation changed evidence",
);
check(
  same(outputState().names, ["T32SyntheticDraft-v1.md", "索引.json"].sort()),
  "repeat confirmation added outputs",
);

const ledgerBeforeClose = readNdjson(path.join(root, "requests.ndjson"));
check(
  ledgerBeforeClose.length === BOOTSTRAP_PATHS.length + tcpCount,
  "ASGI/TCP ledger count",
);
for (let index = 0; index < BOOTSTRAP_PATHS.length; index += 1) {
  const item = ledgerBeforeClose[index];
  check(
    item.method === "POST" &&
      item.path === BOOTSTRAP_PATHS[index] &&
      item.status === 200 &&
      item.disposition === "native_app",
    `bootstrap ledger entry ${index + 1}`,
  );
}

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
check(same(final.source_before, final.source_after), "final source snapshots");
check(
  sourcePin.sha256 === final.source_after["entry/server.py"].sha256,
  "final entry source pin",
);
check(final.fixture_source_unchanged === true, "fixture source unchanged");
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
check(same(final.requests, ledgerBeforeClose), "final request ledger");

const settings = readJson(
  path.join(root, "private", "appdata", "settings.json"),
);
check(
  settings.external_llm?.enabled === false &&
    settings.external_llm?.base_url === null,
  "external model off",
);
for (const file of [
  preparedPath,
  startedPath,
  reportPath,
  readyPath,
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
  `PASS T15 native markdown confirmation fixture (${report.task_id}, ${final.outcome}, ASGI 4, TCP ${tcpCount})`,
);
