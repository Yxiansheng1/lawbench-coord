import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = path.join(HERE, "runs");
const SERVER = path.join(HERE, "server.py");
const SAFETY_BASE = path.join(
  "D:\\Lawbeach\\lawbench-coord",
  "T32NativeDocumentCitationInput-20261027-190830",
  "10-MixedMaterialsGui-20261027-164646-server.py",
);
const SOURCE_PINS = path.join(
  "D:\\Lawbeach\\lawbench-coord",
  "T32TaskCancelSourcePinsInput-20261027-145932",
  "reviewed-source-pins.json",
);
const FIXTURE =
  "D:\\Lawbeach\\lawbench-A\\tests\\fixtures\\criminal-01\\转账截图.jpg";
const PDF_FIXTURE =
  "D:\\Lawbeach\\lawbench-A\\tests\\fixtures\\criminal-01\\起诉意见书.pdf";

const EXPECTED_HEAD = "dc56a93be4b07dbe7a48863e3135351659817fb5";
const SOURCE_PINS_BYTES = 53547;
const SOURCE_PINS_SHA256 =
  "5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf";
const SAFETY_BASE_BYTES = 151304;
const SAFETY_BASE_SHA256 =
  "a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5";
const FIXTURE_BYTES = 47379;
const FIXTURE_SHA256 =
  "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad";
const PDF_FIXTURE_BYTES = 57132;
const PDF_FIXTURE_SHA256 =
  "761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191";
const PDF_EXPECTED_PAGES = 5;
const PDF_PAGE2_FRAGMENTS = ["经依法侦查查明", "126,500"];
const PDF_FIRST_PAGE_MARKER = "虚构市公安局虚构区分局";
const MATERIAL_NAME = "起诉意见书";
const CITATION = `〔${MATERIAL_NAME} 第2页〕`;
const READ_START = 2;
const READ_MAX_CHARS = 500;
const DRAFT_TEXT =
  "# T32 native PDF citation\n\n" +
  `引用行：${CITATION}\n\n` +
  "控制行：普通文字，没有出处。\n";
const DRAFT_SHA256 = sha256(Buffer.from(DRAFT_TEXT, "utf8"));

const BOOTSTRAP_PATHS = [
  "/api/case/open",
  "/api/materials/import",
  "/core/task/begin",
  "/core/tool",
  "/core/tool",
  "/core/task/end",
];
const ALLOWED_ROUTES = [
  ["GET", "/api/capsules"],
  ["GET", "/api/case/recent"],
  ["GET", "/api/materials"],
  ["GET", "/api/ocr/jobs"],
  ["GET", "/api/outputs"],
  ["GET", "/api/settings"],
  ["GET", "/api/source"],
  ["GET", "/api/task/current"],
  ["GET", "/api/tasks"],
  ["GET", "/api/wiki/review"],
  ["GET", "/api/wiki/suggestions"],
  ["GET", "/health"],
  ["POST", "/api/case/open"],
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

function lengthPrefixed(value, label = "value") {
  check(typeof value === "string" && value.length > 0, `${label} missing`);
  return value;
}

function pdfPageText(markdown) {
  const matches = [...markdown.matchAll(/^【第([0-9]+)页】$/gm)];
  check(
    same(
      matches.map((match) => Number(match[1])),
      [1, 2, 3, 4, 5],
    ),
    "derived PDF page markers",
  );
  const pages = new Map();
  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index].index + matches[index][0].length;
    const end =
      index + 1 < matches.length ? matches[index + 1].index : markdown.length;
    pages.set(Number(matches[index][1]), markdown.slice(start, end).trim());
  }
  check(
    PDF_PAGE2_FRAGMENTS.every((fragment) => pages.get(2).includes(fragment)),
    "derived PDF page-2 fragments",
  );
  check(
    !pages.get(2).includes(PDF_FIRST_PAGE_MARKER),
    "derived PDF page 2 excludes first-page heading",
  );
  return pages;
}

function pngIdentity(value) {
  lengthPrefixed(value, "page PNG base64");
  check(/^[A-Za-z0-9+/]*={0,2}$/.test(value), "page PNG base64 alphabet");
  check(value.length % 4 === 0, "page PNG base64 length");
  const raw = Buffer.from(value, "base64");
  check(raw.length >= 33 && raw.length <= 1024 * 1024, "page PNG bytes");
  check(raw.toString("base64") === value, "page PNG canonical base64");
  check(raw.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")), "page PNG magic");
  check(raw.subarray(8, 16).equals(Buffer.from("0000000d49484452", "hex")), "page PNG IHDR");
  const width = raw.readUInt32BE(16);
  const height = raw.readUInt32BE(20);
  check(
    Number.isInteger(width) &&
      Number.isInteger(height) &&
      width > 0 &&
      height > 0 &&
      !(width === 1 && height === 1) &&
      Math.max(width, height) <= 2480,
    "page PNG dimensions",
  );
  return { raw, width, height };
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

function oneDirectory(directory) {
  const values = fs.readdirSync(directory, { withFileTypes: true });
  check(values.length === 1, `expected one child in ${directory}`);
  check(values[0].isDirectory(), `expected directory ${values[0].name}`);
  return path.join(directory, values[0].name);
}

function requiredEnv(name) {
  const value = process.env[name];
  check(typeof value === "string" && value.length > 0, `missing ${name}`);
  return value;
}

const rawRoot = requiredEnv("LB_NATIVE_CITATION_ROOT");
const rawPort = requiredEnv("LB_NATIVE_CITATION_PORT");
const token = requiredEnv("LB_NATIVE_CITATION_TOKEN");
const root = path.resolve(rawRoot);
const runs = path.resolve(RUNS);
const port = Number(rawPort);

check(
  path.dirname(root).toLowerCase() === runs.toLowerCase(),
  "root must be a direct child of this fixture's runs",
);
check(
  /^T32-pdf-citation-[0-9]{8}-[0-9]{6}$/.test(path.basename(root)),
  "run name",
);
check(fs.existsSync(root), "fixture root does not exist");
check(/^[0-9]+$/.test(rawPort), "port format");
check(
  Number.isInteger(port) &&
    port >= 1024 &&
    port <= 65535 &&
    !(port >= 65001 && port <= 65005),
  "port range",
);
check(/^[0-9a-f]{64}$/.test(token), "token format");

const prepared = readJson(path.join(root, "prepared.json"));
const started = readJson(path.join(root, "started.json"));
const report = readJson(path.join(root, "bootstrap-report.json"));
const ready = readJson(path.join(root, "ready.json"));
const caseRoot = prepared.paths?.case?.path;

check(
  prepared.format === "T32-native-pdf-citation-entry-prepared-v1",
  "prepared format",
);
check(prepared.expected_head === EXPECTED_HEAD, "prepared HEAD");
check(path.resolve(prepared.paths?.root?.path || "") === root, "prepared root");
check(caseRoot && path.isAbsolute(caseRoot), "prepared case root");
check(started.root === root && started.host_port === port, "started identity");
check(ready.port === port && ready.host === "127.0.0.1", "ready listener");
check(ready.expected_head === prepared.expected_head, "ready HEAD");
check(ready.pid === started.pid, "server PID continuity");
check(
  ready.started_at &&
    Date.parse(ready.started_at) >= Date.parse(report.finished_at),
  "bootstrap completed before ready",
);
check(
  Date.parse(report.started_at) <= Date.parse(report.finished_at),
  "bootstrap time order",
);

const pinsBytes = readFile(SOURCE_PINS);
check(pinsBytes.length === SOURCE_PINS_BYTES, "source pins bytes");
check(sha256(pinsBytes) === SOURCE_PINS_SHA256, "source pins hash");
check(
  prepared.source_pins?.sha256 === SOURCE_PINS_SHA256 &&
    prepared.source_pins?.frozen_sha256 === SOURCE_PINS_SHA256 &&
    prepared.source_pins?.bytes === SOURCE_PINS_BYTES,
  "prepared source pins",
);
const baseBytes = readFile(SAFETY_BASE);
check(baseBytes.length === SAFETY_BASE_BYTES, "safety base bytes");
check(sha256(baseBytes) === SAFETY_BASE_SHA256, "safety base hash");
check(
  prepared.safety_base?.sha256 === SAFETY_BASE_SHA256 &&
    prepared.safety_base?.frozen_sha256 === SAFETY_BASE_SHA256 &&
    prepared.safety_base?.bytes === SAFETY_BASE_BYTES,
  "prepared safety base",
);
const serverBytes = readFile(SERVER);
const sourcePin = prepared.source?.["entry/server.py"];
check(
  sourcePin?.sha256 === sha256(serverBytes) &&
    sourcePin?.bytes === serverBytes.length,
  "entry source pin",
);
check(
  Object.keys(prepared.source).filter(
    (name) => /^service\/|^contracts\//.test(name),
  ).length === 346,
  "346 frozen source pins plus entry",
);
check(
  prepared.pdf_source?.bytes === PDF_FIXTURE_BYTES &&
    prepared.pdf_source?.sha256 === PDF_FIXTURE_SHA256 &&
    prepared.pdf_copy?.bytes === PDF_FIXTURE_BYTES &&
    prepared.pdf_copy?.sha256 === PDF_FIXTURE_SHA256 &&
    prepared.citation_source?.sha256 === PDF_FIXTURE_SHA256 &&
    prepared.input_ready?.names?.includes("转账截图.jpg") &&
    prepared.input_ready?.names?.includes("起诉意见书.pdf") &&
    prepared.input_ready?.jpeg_control_imported === false &&
    prepared.input_ready?.pdf_reference_import_only === true,
  "prepared JPEG control and PDF citation sources",
);
check(
  same(prepared.citation, {
    text: CITATION,
    material_name: MATERIAL_NAME,
    unit: "page",
    from: READ_START,
  }) &&
    same(prepared.read, {
      start: READ_START,
      max_chars: READ_MAX_CHARS,
    }),
  "prepared page-2 citation and bounded read",
);

check(report.transport === "ASGI-inprocess-no-socket", "bootstrap transport");
check(report.native_call_count === 6, "bootstrap call count");
check(
  same(
    report.native_calls.map((item) => [item.method, item.path, item.status]),
    BOOTSTRAP_PATHS.map((item) => ["POST", item, 200]),
  ),
  "bootstrap call ledger",
);
check(
  same(report.usage, { model_calls: 0, tool_calls: 2, elapsed_s: 0 }),
  "bootstrap usage",
);
check(
  report.task_state === "finished" &&
    report.result_status === "cancelled" &&
    report.one_draft_only === true &&
    report.model_calls_zero === true &&
    report.ocr_started === false &&
    report.real_native_records_only === true &&
    report.not_tcp_or_gui_proof === true,
  "bootstrap markers",
);
check(/^T-[0-9]{14}-[0-9a-f]{4}$/.test(report.task_id), "task id");
check(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
    report.case_id,
  ),
  "case id",
);
const materialId = report.material?.material_id;
check(/^M[0-9]{4}$/.test(materialId), "material id");
check(
  report.material?.name === MATERIAL_NAME &&
    report.material?.origin === "ref" &&
    report.material?.ref_id === "R01" &&
    report.material?.type === "pdf" &&
    report.material?.unit === "page" &&
    report.material?.unit_count === PDF_EXPECTED_PAGES &&
    report.material?.bytes === PDF_FIXTURE_BYTES &&
    report.material?.sha256 === PDF_FIXTURE_SHA256 &&
    same(report.pages_need_ocr, []) &&
    same(report.derived_text, {
      pages: PDF_EXPECTED_PAGES,
      page2_fragments: PDF_PAGE2_FRAGMENTS,
      page2_excludes_first_page_marker: true,
    }),
  "material identity",
);
check(
  report.reference?.ref_id === "R01" &&
    report.reference?.kind === "file" &&
    report.reference?.status === "ok" &&
    path.resolve(report.reference.path) ===
      path.resolve(path.dirname(caseRoot), "input", "ready", "起诉意见书.pdf"),
  "native reference identity",
);
check(
  same(report.citation, {
    material_id: materialId,
    material_version: report.material.sha256,
    name: MATERIAL_NAME,
    loc: { unit: "page", from: READ_START },
  }),
  "real citation record",
);
check(
  report.citation_check?.passed === true &&
    same(report.citation_check?.problems, []) &&
    report.citation_check?.stats?.citations === 1,
  "citation check",
);
check(
  same(report.coverage, {
    total: 1,
    fully_read: [],
    partially_read: [
      { name: MATERIAL_NAME, read_units: 1, total_units: PDF_EXPECTED_PAGES },
    ],
    not_read: [],
    unreadable: [],
  }),
  "native coverage",
);
check(
  report.read_response?.name === MATERIAL_NAME &&
    report.read_response?.material_id === materialId &&
    report.read_response?.unit === "page" &&
    report.read_response?.start === READ_START &&
    report.read_response?.end === READ_START &&
    report.read_response?.text?.startsWith(`【第${READ_START}页】\n`) &&
    PDF_PAGE2_FRAGMENTS.every((fragment) =>
      report.read_response.text.includes(fragment),
    ) &&
    !report.read_response.text.includes(PDF_FIRST_PAGE_MARKER) &&
    report.read_response?.has_more === true &&
    report.read_response?.next_start === READ_START + 1 &&
    report.read_response?.next_offset === null,
  "native material read",
);
check(
  report.draft?.text === DRAFT_TEXT &&
    report.draft?.bytes === Buffer.byteLength(DRAFT_TEXT, "utf8") &&
    report.draft?.sha256 === DRAFT_SHA256 &&
    report.draft?.relative_path ===
      `工作区/任务/${report.task_id}/草稿/T32NativePdfCitation-v1.md`,
  "bootstrap draft identity",
);

const taskBase = path.join(caseRoot, "工作区", "任务");
const taskDir = oneDirectory(taskBase);
check(path.basename(taskDir) === report.task_id, "one owned task");
check(
  same(
    fs.readdirSync(taskDir).sort(),
    ["task.json", "result.json", "reads.json", "草稿"].sort(),
  ),
  "task file set",
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
    task.state === "finished" &&
    !Object.prototype.hasOwnProperty.call(task, "request_id") &&
    !Object.prototype.hasOwnProperty.call(task, "request_scope"),
  "actual legacy unscoped task",
);
check(
  result.task_id === report.task_id &&
    result.status === "cancelled" &&
    same(result.usage, report.usage) &&
    result.finished_at !== null &&
    result.drafts.length === 1 &&
    result.drafts[0].version === 1 &&
    result.drafts[0].path === report.draft.relative_path &&
    result.citations.length === 1 &&
    same(result.citations[0], report.citation),
  "actual native result",
);
check(
  reads.task_id === report.task_id &&
    reads.reads.length === 1 &&
    reads.reads[0].unit === "page" &&
    reads.reads[0].from === READ_START &&
    reads.reads[0].to === READ_START &&
    same(reads.reads[0], report.read_record === undefined ? null : {
      material_id: report.read_record.material_id,
      material_version: report.material.sha256,
      unit: report.read_record.unit,
      from: report.read_record.from,
      to: report.read_record.to,
      at: reads.reads[0]?.at,
    }),
  "actual native read record",
);
check(
  result.citation_check?.passed === true &&
    result.citation_check?.stats?.citations === 1 &&
    result.citations.length === 1 &&
    same(result.coverage, report.coverage),
  "persisted citation byproduct",
);

const draftDir = path.join(taskDir, "草稿");
check(
  same(fs.readdirSync(draftDir), ["T32NativePdfCitation-v1.md"]),
  "one native draft",
);
const draftBytes = readFile(casePath(caseRoot, report.draft.relative_path));
check(
  draftBytes.toString("utf8") === DRAFT_TEXT &&
    draftBytes.length === report.draft.bytes &&
    sha256(draftBytes) === report.draft.sha256,
  "native draft identity",
);

const index = readJson(path.join(caseRoot, "工作区", "材料", "index.json"));
check(
  index.case_id === report.case_id &&
    index.materials.length === 1 &&
    index.materials[0].material_id === materialId &&
    index.materials[0].name === MATERIAL_NAME &&
    index.materials[0].origin === "ref" &&
    index.materials[0].ref_id === "R01" &&
    index.materials[0].type === "pdf" &&
    index.materials[0].status === "parsed" &&
    index.materials[0].unit === "page" &&
    index.materials[0].unit_count === PDF_EXPECTED_PAGES &&
    same(index.materials[0].pages_need_ocr, []) &&
    index.materials[0].is_ocr === "none" &&
    index.materials[0].size === PDF_FIXTURE_BYTES &&
    index.materials[0].sha256 === PDF_FIXTURE_SHA256 &&
    index.materials[0].rel_path === "工作区/引用/R01/起诉意见书.pdf" &&
    index.materials[0].text_path ===
      "工作区/材料/文本/工作区/引用/R01/起诉意见书.pdf.md",
  "actual material index",
);
check(
  !fs.existsSync(path.join(caseRoot, "起诉意见书.pdf")),
  "reference PDF is not copied at case root",
);
check(
  !fs.existsSync(path.join(caseRoot, "工作区", "引用", "R01", "起诉意见书.pdf")),
  "reference PDF has no case-local virtual-path file",
);
const derivedPages = pdfPageText(
  readFile(casePath(caseRoot, index.materials[0].text_path)).toString("utf8"),
);
check(derivedPages.size === PDF_EXPECTED_PAGES, "five derived PDF pages");

const refs = readJson(path.join(caseRoot, "工作区", "材料", "引用.json"));
check(
  refs.refs.length === 1 &&
    refs.refs[0].ref_id === "R01" &&
    path.resolve(refs.refs[0].path) ===
      path.resolve(root, "input", "ready", "起诉意见书.pdf") &&
    refs.refs[0].kind === "file" &&
    refs.refs[0].status === "ok",
  "actual reference registry",
);
const sourceBytes = readFile(
  path.join(root, "input", "ready", "起诉意见书.pdf"),
);
check(
  sourceBytes.length === PDF_FIXTURE_BYTES &&
    sha256(sourceBytes) === PDF_FIXTURE_SHA256 &&
    sha256(sourceBytes) === report.material.sha256,
  "owned reference source",
);
const originalPdfBytes = readFile(PDF_FIXTURE);
check(
  originalPdfBytes.length === PDF_FIXTURE_BYTES &&
    sha256(originalPdfBytes) === PDF_FIXTURE_SHA256,
  "original PDF fixture identity remains separate",
);
check(
  same(
    fs.readdirSync(path.join(root, "input", "ready")).sort(),
    ["转账截图.jpg", "起诉意见书.pdf"].sort(),
  ),
  "ready contains exactly JPEG control and one PDF",
);

const fixtureBytes = readFile(FIXTURE);
const fixtureCopy = readFile(path.join(root, "input", "ready", "转账截图.jpg"));
check(
  fixtureBytes.length === FIXTURE_BYTES &&
    sha256(fixtureBytes) === FIXTURE_SHA256 &&
    fixtureCopy.length === FIXTURE_BYTES &&
    sha256(fixtureCopy) === FIXTURE_SHA256,
  "JPEG fixture identity without import or OCR",
);

const registry = readJson(
  path.join(root, "private", "appdata", "cases.json"),
);
check(
  registry.v === 1 &&
    registry.cases.length === 1 &&
    registry.cases[0].case_id === report.case_id &&
    path.resolve(registry.cases[0].root) === path.resolve(caseRoot),
  "owned case registry",
);

const apiBase = `http://127.0.0.1:${port}`;
const authHeaders = { Authorization: `Bearer ${token}` };

async function request(method, pathname, body, headers = authHeaders) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const initHeaders = { ...headers, Connection: "close" };
  const init = {
    method,
    headers: initHeaders,
    redirect: "error",
    signal: controller.signal,
  };
  if (body !== undefined) {
    initHeaders["Content-Type"] = "application/json";
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
      response.json?.status === "ok" &&
        response.json?.contract_version === "1.6",
      "health response",
    );
    return response.json;
  }
  check(
    response.json?.ok === true &&
      Object.prototype.hasOwnProperty.call(response.json, "value"),
    `${method} ${pathname} envelope`,
  );
  return response.json.value;
}

function lastLedger() {
  const ledger = readNdjson(path.join(root, "requests.ndjson"));
  return ledger.at(-1);
}

async function expectDenied(method, pathname, body, status, disposition) {
  const response = await request(method, pathname, body);
  check(
    response.status === status,
    `${method} ${pathname} expected ${status}, got ${response.status}`,
  );
  const item = lastLedger();
  check(
    item.method === method &&
      item.path === pathname.split("?")[0] &&
      item.status === status &&
      item.disposition === disposition,
    `${method} ${pathname} pre-forward ledger`,
  );
}

async function expectAuthDenied(method, pathname, body) {
  const missing = await request(method, pathname, body, {});
  check(missing.status === 401, "missing auth denied");
  check(
    lastLedger().disposition === "auth_not_forwarded",
    "missing auth before forward",
  );
  const wrong = await request(method, pathname, body, {
    Authorization: "Bearer wrong",
  });
  check(wrong.status === 401, "wrong auth denied");
  check(
    lastLedger().disposition === "auth_not_forwarded",
    "wrong auth before forward",
  );
}

const caseId = report.case_id;
const taskId = report.task_id;
const sourceUrl = (values) =>
  `/api/source?${new URLSearchParams(values).toString()}`;
const validSource = sourceUrl({
  case_id: caseId,
  material_id: materialId,
  citation: CITATION,
  task_id: taskId,
});

await expectAuthDenied("GET", "/health");
await expectAuthDenied("GET", validSource);

await expectDenied(
  "GET",
  "/api/documents/read",
  undefined,
  403,
  "ROUTE_OR_METHOD_NOT_ALLOWED",
);
await expectDenied(
  "POST",
  "/api/documents/save",
  { case_id: caseId, path: report.draft.relative_path, content: "forbidden" },
  403,
  "ROUTE_OR_METHOD_NOT_ALLOWED",
);
await expectDenied(
  "POST",
  "/core/tool",
  { task_id: taskId, tool: "case_save_draft", args: {} },
  403,
  "ROUTE_OR_METHOD_NOT_ALLOWED",
);
await expectDenied(
  "POST",
  "/api/ocr/jobs",
  { case_id: caseId, material_id: materialId, pages: [1] },
  403,
  "ROUTE_OR_METHOD_NOT_ALLOWED",
);
await expectDenied(
  "PUT",
  "/api/settings",
  {},
  403,
  "ROUTE_OR_METHOD_NOT_ALLOWED",
);

await expectDenied(
  "GET",
  sourceUrl({
    case_id: "00000000-0000-4000-8000-000000000000",
    material_id: materialId,
    citation: CITATION,
    task_id: taskId,
  }),
  undefined,
  403,
  "SOURCE_CASE_ID",
);
await expectDenied(
  "GET",
  sourceUrl({
    case_id: caseId,
    material_id: "M9999",
    citation: CITATION,
    task_id: taskId,
  }),
  undefined,
  403,
  "SOURCE_MATERIAL_ID",
);
await expectDenied(
  "GET",
  sourceUrl({
    case_id: caseId,
    material_id: materialId,
    citation: `〔${MATERIAL_NAME} 第1页〕`,
    task_id: taskId,
  }),
  undefined,
  403,
  "SOURCE_CITATION",
);
await expectDenied(
  "GET",
  sourceUrl({
    case_id: caseId,
    material_id: materialId,
    citation: CITATION,
    task_id: "T-20260101000000-ffff",
  }),
  undefined,
  403,
  "SOURCE_TASK_ID",
);
await expectDenied(
  "GET",
  validSource + "&extra=1",
  undefined,
  403,
  "SOURCE_QUERY_EXACT",
);
await expectDenied(
  "GET",
  sourceUrl({ case_id: caseId, material_id: materialId, citation: CITATION }),
  undefined,
  403,
  "SOURCE_QUERY_EXACT",
);
await expectDenied(
  "GET",
  validSource + `&case_id=${encodeURIComponent(caseId)}`,
  undefined,
  403,
  "SOURCE_QUERY_EXACT",
);

const reopen = await expectOk("POST", "/api/case/open", {
  path: caseRoot,
  template: null,
});
check(reopen.case_id === caseId && reopen.created === false, "GUI case reopen");
const caseQuery = `case_id=${encodeURIComponent(caseId)}`;
const readChecks = [
  ["GET", "/health"],
  ["GET", "/api/case/recent"],
  ["GET", "/api/settings"],
  ["GET", "/api/capsules"],
  ["GET", `/api/materials?${caseQuery}`],
  ["GET", `/api/tasks?${caseQuery}`],
  ["GET", `/api/outputs?${caseQuery}`],
  ["GET", `/api/ocr/jobs?${caseQuery}`],
  ["GET", `/api/wiki/suggestions?${caseQuery}`],
  ["GET", `/api/wiki/review?${caseQuery}`],
];
for (const [method, pathname] of readChecks) {
  await expectOk(method, pathname);
}
const tasks = await expectOk("GET", `/api/tasks?${caseQuery}`);
check(
  tasks.tasks.length === 1 &&
    tasks.tasks[0].task_id === taskId &&
    same(
      tasks.tasks[0].drafts.map((item) => item.path),
      [report.draft.relative_path],
    ),
  "tasks read exposes one real draft",
);
const materials = await expectOk("GET", `/api/materials?${caseQuery}`);
check(
  materials.materials.length === 1 &&
    materials.materials[0].material_id === materialId &&
    materials.materials[0].name === MATERIAL_NAME &&
    materials.materials[0].origin === "ref",
  "materials read exposes real reference",
);
const current = await expectOk(
  "GET",
  `/api/task/current?session_id=22222222-2222-4222-8222-222222222222`,
);
check(same(current, { selection: null }), "UI task selection is null");

const source = await expectOk("GET", validSource);
check(
  source.name === MATERIAL_NAME &&
    same(source.loc, { unit: "page", from: READ_START }) &&
    typeof source.text === "string" &&
    PDF_PAGE2_FRAGMENTS.every((fragment) => source.text.includes(fragment)) &&
    !source.text.includes(PDF_FIRST_PAGE_MARKER) &&
    typeof source.page_png_base64 === "string" &&
    source.page_png_base64.length > 0 &&
    source.source_changed === false &&
    source.original_status === "ok",
  "TCP actual PDF page-2 source",
);
const png = pngIdentity(source.page_png_base64);
const capturePath = path.join(root, "probe-page2.png");
check(!fs.existsSync(capturePath), "probe PNG capture target must be fresh");
fs.writeFileSync(capturePath, png.raw, { flag: "wx" });
const capturedPng = readFile(capturePath);
check(
  capturedPng.equals(png.raw) &&
    capturedPng.readUInt32BE(16) === png.width &&
    capturedPng.readUInt32BE(20) === png.height,
  "captured actual returned page-2 PNG",
);
await expectDenied(
  "GET",
  validSource,
  undefined,
  403,
  "SOURCE_ALREADY_ATTEMPTED",
);

const afterSource = await expectOk("GET", `/api/tasks?${caseQuery}`);
check(afterSource.tasks[0].task_id === taskId, "normal reads after source");

async function waitForNaturalClose() {
  const finalPath = path.join(root, "final-metadata.json");
  const loopPath = path.join(root, "loop-closed.json");
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(finalPath) && fs.existsSync(loopPath)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail("natural close evidence timeout");
}

await waitForNaturalClose();
const final = readJson(path.join(root, "final-metadata.json"));
const loop = readJson(path.join(root, "loop-closed.json"));
check(!fs.existsSync(path.join(root, "run-error.json")), "unexpected run-error");
check(
  final.outcome === "COMPLETED_FOR_ROOT_REVIEW" &&
    final.failure_code === null,
  "natural server outcome",
);
check(
  final.root === root &&
    final.requested_seconds === 20 &&
    same(final.bootstrap_report, report),
  "final root and bootstrap report",
);
check(
  final.source_unchanged === true &&
    same(final.source_before, final.source_after),
  "frozen source identity unchanged",
);
check(
  final.source_pins_sha256 === SOURCE_PINS_SHA256 &&
    final.source_after["entry/server.py"].sha256 === sha256(serverBytes),
  "final source pins and entry",
);
check(
  final.fixture_source_unchanged === true &&
    final.fixture_copy_unchanged === true &&
    final.pdf_source_unchanged === true &&
    final.pdf_copy_unchanged === true &&
    final.citation_source_unchanged === true &&
    final.settings_unchanged === true &&
    final.daily_marker_unchanged === true,
  "fixture, reference, settings, and marker unchanged",
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
    Array.isArray(final.guard?.violations) &&
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
    final.native_app?.auth ===
      "exact wrapper token check before claims, then native middleware",
  "native app lifecycle/auth",
);
check(
  final.listener?.ipv4_only === true &&
    final.listener?.websocket === false &&
    final.listener?.forward_listener === false,
  "listener boundary",
);
check(
  same(
    final.native_app.allowed_routes
      .map((item) => item.join(" "))
      .sort(),
    ALLOWED_ROUTES.map((item) => item.join(" ")).sort(),
  ),
  "exact read-only route union",
);
check(
  final.protocol?.protocol_complete === true &&
    final.protocol?.source_claimed === true &&
    final.protocol?.source_complete === true &&
    same(final.protocol?.source_page_png, {
      bytes: png.raw.length,
      width: png.width,
      height: png.height,
    }) &&
    final.protocol?.case_open_ok === 1 &&
    final.protocol?.auth_denials === 4,
  "protocol completion and auth claims",
);
check(
  final.requests.filter(
    (item) => item.path === "/api/source" && item.disposition === "native_app",
  ).length === 1,
  "exactly one forwarded source request",
);
check(
  final.requests.filter(
    (item) =>
      item.disposition !== "native_app" &&
      item.disposition !== "auth_not_forwarded",
  ).every((item) => item.status === 403),
  "all non-forwarded policy replies rejected",
);
check(same(final.requests, readNdjson(path.join(root, "requests.ndjson"))), "request ledger");
check(
  loop.event_loop_closed === true &&
    loop.final_metadata_written === true &&
    Date.parse(loop.closed_at) >= Date.parse(final.finished_at),
  "event loop close",
);

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
  path.join(root, "native-calls.ndjson"),
  path.join(root, "bootstrap-report.json"),
  path.join(root, "ready.json"),
  path.join(root, "requests.ndjson"),
  path.join(root, "final-metadata.json"),
  path.join(root, "loop-closed.json"),
  path.join(root, "private", "appdata", "settings.json"),
]) {
  check(!readFile(file).toString("utf8").includes(token), "token leak");
}
for (const file of [final.service_log].filter(
  (value) => value && fs.existsSync(value),
)) {
  const text = readFile(file).toString("utf8");
  check(!text.includes(token), "service log token leak");
  check(!text.includes(CITATION), "service log citation leak");
  check(
    PDF_PAGE2_FRAGMENTS.every((fragment) => !text.includes(fragment)),
    "service log source text leak",
  );
  check(!text.includes(DRAFT_TEXT), "service log model output leak");
}

console.log(
  `PASS T32 native PDF citation entry (${taskId}, ${materialId}, ${final.outcome})`,
);
