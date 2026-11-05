#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const TARGET = "M0002";
const REMAINING = ["M0001", "M0003"];
const SOURCE_NAMES = ["scope-in.txt", "scope-out.txt", "scope-third.txt"];
const CASE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const root = process.env.LB_REF_REMOVE_GUI_ROOT;
assert.ok(root, "LB_REF_REMOVE_GUI_ROOT is required");
assert.ok(path.isAbsolute(root), "run root must be absolute");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function within(parent, candidate) {
  const rel = path.relative(path.resolve(parent), path.resolve(candidate));
  return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".." && !path.isAbsolute(rel));
}

function hashFile(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function envelope(body, label) {
  assert.ok(body && typeof body === "object", `${label}: response object`);
  assert.deepEqual(Object.keys(body).sort(), ["ok", "value"], `${label}: envelope keys`);
  assert.equal(body.ok, true, `${label}: ok`);
  assert.ok(body.value && typeof body.value === "object", `${label}: value`);
  return body.value;
}

function request(ready, method, requestPath, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined
      ? undefined
      : Buffer.from(JSON.stringify(options.body), "utf8");
    const headers = {};
    if (options.duplicateOrder) {
      const good = `Bearer ${ready.token}`;
      const wrongToken = crypto.createHash("sha256").update(ready.token).digest("hex");
      assert.notEqual(wrongToken, ready.token, "authorization controls differ");
      const bad = `Bearer ${wrongToken}`;
      headers.Authorization = options.duplicateOrder === "good-first"
        ? [good, bad]
        : [bad, good];
    } else {
      headers.Authorization = `Bearer ${ready.token}`;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = String(body.length);
    } else if (method === "POST") {
      headers["Content-Length"] = "0";
    }
    const req = http.request({
      hostname: "127.0.0.1",
      port: ready.port,
      method,
      path: requestPath,
      headers,
      agent: false,
      timeout: 5000,
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null; } catch {}
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request timeout")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function expectError(response, status, code, label) {
  assert.equal(response.status, status, `${label}: HTTP status`);
  assert.equal(response.body?.error?.code, code, `${label}: error code`);
}

function sourceSnapshot(prepared) {
  const sourceDir = prepared.scope_source.path;
  const rows = [];
  for (const name of SOURCE_NAMES) {
    const declared = prepared.scope_source.files.find((item) => item.name === name);
    assert.ok(declared, `${name}: declared source`);
    const file = path.join(sourceDir, name);
    assert.equal(path.resolve(file), path.resolve(declared.path), `${name}: source path`);
    const stat = fs.lstatSync(file, { bigint: true });
    assert.ok(stat.isFile(), `${name}: regular file`);
    assert.equal(stat.nlink, 1n, `${name}: hardlink count`);
    assert.equal(Number(stat.size), declared.bytes, `${name}: bytes`);
    assert.equal(hashFile(file), declared.sha256, `${name}: sha256`);
    rows.push({
      name,
      path: path.resolve(file),
      bytes: Number(stat.size),
      sha256: hashFile(file),
      mtime_ns: String(stat.mtimeNs),
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

function sortedRows(rows) {
  return [...rows].sort((a, b) => a.material_id.localeCompare(b.material_id));
}

function nativeState(casePath, ready) {
  const refsFile = path.join(casePath, "工作区", "材料", "引用.json");
  const indexFile = path.join(casePath, "工作区", "材料", "index.json");
  const refs = readJson(refsFile);
  const index = readJson(indexFile);
  assert.equal(refs.refs.length, 1, "one reference root");
  assert.deepEqual(Object.keys(refs).sort(), ["next_seq", "refs", "v"], "reference document keys");
  assert.equal(refs.v, 1, "reference document version");
  assert.equal(refs.next_seq, 2, "reference document next sequence");
  assert.deepEqual(
    Object.keys(refs.refs[0]).sort(),
    ["added_at", "checked_at", "kind", "path", "ref_id", "status"],
    "reference entry keys",
  );
  assert.deepEqual(
    Object.keys(ready.setup.refs).sort(),
    ["canonical", "kind", "path", "ref_id", "status"],
    "seeded reference summary keys",
  );
  assert.deepEqual({
    ref_id: refs.refs[0].ref_id,
    path: path.resolve(refs.refs[0].path),
    kind: refs.refs[0].kind,
    status: refs.refs[0].status,
  }, {
    ref_id: ready.setup.refs.ref_id,
    path: path.resolve(ready.setup.refs.path),
    kind: ready.setup.refs.kind,
    status: ready.setup.refs.status,
  }, "reference identity matches seeded summary");
  assert.equal(refs.refs[0].ref_id, "R01", "reference id");
  assert.equal(refs.refs[0].status, "ok", "reference root remains live");
  assert.equal(path.resolve(refs.refs[0].path), path.resolve(ready.scope_source.path), "reference path");
  assert.equal(index.v, 1, "index version");
  assert.equal(index.case_id, ready.setup.case_id, "index case id");
  assert.equal(index.next_seq, 4, "material sequence retained");
  assert.equal(index.materials.length, 3, "raw index keeps three rows");
  return { refs, index, indexFile };
}

async function waitForShutdown(rootPath, seconds) {
  const finalFile = path.join(rootPath, "final-metadata.json");
  const closedFile = path.join(rootPath, "loop-closed.json");
  const deadline = Date.now() + (Math.max(1, seconds) + 20) * 1000;
  while (Date.now() < deadline) {
    if (fs.existsSync(finalFile) && fs.existsSync(closedFile)) {
      return { final: readJson(finalFile), closed: readJson(closedFile) };
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("natural server shutdown evidence timeout");
}

async function main() {
  const readyFile = path.join(root, "ready.json");
  const preparedFile = path.join(root, "prepared.json");
  assert.ok(within(root, readyFile) && within(root, preparedFile), "run evidence outside root");
  const ready = readJson(readyFile);
  const prepared = readJson(preparedFile);
  assert.equal(prepared.format, "T32-reference-remove-gui-prepared-v1", "prepared format");
  assert.equal(ready.status, "ready", "ready status");
  assert.equal(ready.host, "127.0.0.1", "ready host");
  assert.ok(Number.isInteger(ready.port) && ready.port >= 1 && ready.port <= 65535, "random loopback port");
  assert.ok(typeof ready.token === "string" && /^[0-9a-f]{64}$/.test(ready.token), "ready token");
  assert.ok(Number.isInteger(ready.requested_seconds) && ready.requested_seconds < 600,
    "finite server lifetime");
  assert.equal(ready.case_path, prepared.paths.case.path, "ready case");
  assert.ok(ready.setup && typeof ready.setup === "object", "setup evidence");
  assert.ok(CASE_ID.test(ready.setup.case_id), "setup case id");
  assert.equal(ready.setup.target_material_id, TARGET, "setup target");
  assert.deepEqual(
    [...ready.setup.material_ids].sort(),
    ["M0001", "M0002", "M0003"],
    "setup material ids",
  );
  assert.equal(ready.setup.requests.length, 3, "exact three setup requests");
  assert.deepEqual(
    ready.setup.requests.map((row) => [row.method, row.path, row.status, row.channel]),
    [
      ["POST", "/api/case/open", 200, "setup_asgi"],
      ["POST", "/api/materials/import", 200, "setup_asgi"],
      ["POST", "/api/materials/import", 200, "setup_asgi"],
    ],
    "setup ASGI ledger",
  );

  const sourceBefore = sourceSnapshot(prepared);
  const before = nativeState(ready.case_path, ready);
  const indexHash = hashFile(before.indexFile);
  const target = before.index.materials.find((row) => row.material_id === TARGET);
  assert.ok(target, "raw target row");
  assert.equal(target.rel_path, "工作区/引用/R01/scope-out.txt", "target relative path");
  assert.equal(target.status, "parsed", "target initially parsed");
  assert.equal(target.origin, "ref", "target origin");
  assert.equal(target.ref_id, "R01", "target ref");
  const targetText = path.join(ready.case_path, ...target.text_path.split("/"));
  assert.ok(fs.existsSync(targetText), "target derived text initially present");

  const materialsPath = "/api/materials";
  const caseQuery = `case_id=${encodeURIComponent(ready.setup.case_id)}`;
  const activeRows = sortedRows(ready.setup.public_materials);
  for (const [label, suffix] of [
    ["default", ""],
    ["false", "&include_removed=false"],
    ["true", "&include_removed=true"],
  ]) {
    const response = await request(ready, "GET", `${materialsPath}?${caseQuery}${suffix}`);
    assert.equal(response.status, 200, `pre-remove ${label} list: HTTP status`);
    const value = envelope(response.body, `pre-remove ${label} list`);
    assert.deepEqual(sortedRows(value.materials), activeRows, `pre-remove ${label} list: exact rows`);
    assert.ok(value.materials.every((row) => row.status === "parsed"),
      `pre-remove ${label} list: all three parsed`);
  }

  const caseOpenPath = "/api/case/open";
  const refsFile = path.join(ready.case_path, "工作区", "材料", "引用.json");
  const refsHash = hashFile(refsFile);
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const caseOpenResponse = await request(ready, "POST", caseOpenPath, {
      body: { path: ready.case_path, template: null },
    });
    assert.equal(caseOpenResponse.status, 200, `normal same-case reopen ${attempt}: HTTP status`);
    assert.deepEqual(envelope(caseOpenResponse.body, `normal same-case reopen ${attempt}`), {
      case_id: ready.setup.case_id,
      name: "case",
      created: false,
      folders_created: [],
      kind: null,
    }, `normal same-case reopen ${attempt}: native response`);
  }
  expectError(await request(ready, "POST", caseOpenPath, {
    body: { path: ready.case_path, template: null },
  }), 403, "CASE_OPEN_AFTER_SETUP", "third same-case reopen");
  assert.equal(hashFile(refsFile), refsHash, "same-case opens did not touch references");
  assert.equal(hashFile(before.indexFile), indexHash, "same-case opens did not touch index");
  assert.deepEqual(nativeState(ready.case_path, ready), before, "same-case opens did not mutate native state");
  assert.deepEqual(sourceSnapshot(prepared), sourceBefore, "same-case opens did not touch source");
  assert.ok(fs.existsSync(targetText), "same-case opens did not delete derived text");

  const removePath = "/api/materials/remove";
  expectError(await request(ready, "POST", removePath, {
    body: { case_id: "22222222-2222-4222-8222-222222222222", material_ids: [TARGET] },
  }), 403, "REMOVE_CASE", "wrong case");
  expectError(await request(ready, "POST", removePath, {
    body: { case_id: ready.setup.case_id, material_ids: ["M0001"] },
  }), 403, "REMOVE_TARGET", "wrong material id");
  expectError(await request(ready, "POST", removePath, {
    body: { case_id: ready.setup.case_id, material_ids: [TARGET], extra: true },
  }), 403, "REMOVE_BODY", "extra body key");
  expectError(await request(ready, "POST", `${removePath}?unexpected=1`, {
    body: { case_id: ready.setup.case_id, material_ids: [TARGET] },
  }), 403, "REMOVE_QUERY", "unexpected query");
  for (const order of ["good-first", "bad-first"]) {
    expectError(await request(ready, "POST", removePath, {
      body: { case_id: ready.setup.case_id, material_ids: [TARGET] },
      duplicateOrder: order,
    }), 401, "UNAUTHORIZED", `duplicate authorization ${order}`);
  }

  assert.equal(hashFile(before.indexFile), indexHash, "negative requests did not touch index");
  assert.deepEqual(nativeState(ready.case_path, ready), before, "negative requests did not touch native state");
  assert.deepEqual(sourceSnapshot(prepared), sourceBefore, "negative requests did not touch source");
  assert.ok(fs.existsSync(targetText), "negative requests did not delete derived text");

  const removedResponse = await request(ready, "POST", removePath, {
    body: { case_id: ready.setup.case_id, material_ids: [TARGET] },
  });
  assert.equal(removedResponse.status, 200, "remove HTTP status");
  assert.deepEqual(envelope(removedResponse.body, "remove"), {
    removed: [TARGET],
    already_removed: [],
    failed: [],
    wiki_needs_update: false,
  }, "native remove envelope");

  const after = nativeState(ready.case_path, ready);
  assert.deepEqual(after.refs, before.refs, "reference root unchanged and live");
  assert.equal(after.index.next_seq, before.index.next_seq, "next_seq retained");
  const afterById = new Map(after.index.materials.map((row) => [row.material_id, row]));
  const beforeById = new Map(before.index.materials.map((row) => [row.material_id, row]));
  assert.deepEqual([...afterById.keys()].sort(), ["M0001", "M0002", "M0003"], "tombstone id set");
  assert.equal(afterById.get(TARGET).status, "removed", "target tombstone");
  for (const id of REMAINING) {
    assert.deepEqual(afterById.get(id), beforeById.get(id), `remaining raw identity ${id}`);
  }
  assert.equal(fs.existsSync(targetText), false, "target derived text deleted");

  for (const [label, query] of [
    ["wrong case", "case_id=22222222-2222-4222-8222-222222222222"],
    ["duplicate flag", `${caseQuery}&include_removed=true&include_removed=false`],
    ["duplicate case", `${caseQuery}&${caseQuery}`],
    ["invalid flag", `${caseQuery}&include_removed=yes`],
    ["extra query", `${caseQuery}&unexpected=1`],
  ]) {
    expectError(await request(ready, "GET", `${materialsPath}?${query}`),
      403, "MATERIALS_LIST_QUERY", `materials ${label}`);
  }
  assert.deepEqual(nativeState(ready.case_path, ready), after,
    "invalid material queries did not touch native state");
  assert.deepEqual(sourceSnapshot(prepared), sourceBefore,
    "invalid material queries did not touch source");

  const remainingRows = sortedRows(
    ready.setup.public_materials.filter((row) => REMAINING.includes(row.material_id)),
  );
  const defaultResponse = await request(ready, "GET", `${materialsPath}?${caseQuery}`);
  assert.equal(defaultResponse.status, 200, "default materials list HTTP status");
  const defaultListed = envelope(defaultResponse.body, "default materials after remove");
  assert.deepEqual(sortedRows(defaultListed.materials), remainingRows,
    "default materials list exact two live rows");
  assert.ok(defaultListed.materials.every((row) =>
    row.origin === "ref" && row.ref_id === "R01" && row.status === "parsed"),
  "default materials list full live identity");

  const falseResponse = await request(ready, "GET",
    `${materialsPath}?${caseQuery}&include_removed=false`);
  assert.equal(falseResponse.status, 200, "false materials list HTTP status");
  const falseListed = envelope(falseResponse.body, "false materials after remove");
  assert.deepEqual(sortedRows(falseListed.materials), remainingRows,
    "false materials list exact two live rows");
  assert.ok(falseListed.materials.every((row) =>
    row.origin === "ref" && row.ref_id === "R01" && row.status === "parsed"),
  "false materials list full live identity");

  const beforePublicTarget = ready.setup.public_materials.find(
    (row) => row.material_id === TARGET,
  );
  assert.ok(beforePublicTarget, "public target before remove");
  const expectedTombstone = {
    ...beforePublicTarget,
    status: "removed",
    stale_ocr: false,
    error: null,
    pages_need_ocr: [],
    pages_mixed: [],
    chars: null,
  };
  const trueResponse = await request(ready, "GET",
    `${materialsPath}?${caseQuery}&include_removed=true`);
  assert.equal(trueResponse.status, 200, "true materials list HTTP status");
  const trueListed = envelope(trueResponse.body, "true materials after remove");
  assert.deepEqual(
    sortedRows(trueListed.materials),
    sortedRows([...remainingRows, expectedTombstone]),
    "true materials list exact two live rows plus persisted tombstone",
  );
  const actualTombstone = trueListed.materials.find((row) => row.material_id === TARGET);
  assert.ok(actualTombstone, "true materials list target tombstone");
  assert.deepEqual({
    material_id: actualTombstone.material_id,
    name: actualTombstone.name,
    rel_path: actualTombstone.rel_path,
    type: actualTombstone.type,
    unit: actualTombstone.unit,
    unit_count: actualTombstone.unit_count,
    is_ocr: actualTombstone.is_ocr,
    origin: actualTombstone.origin,
    ref_id: actualTombstone.ref_id,
    location: actualTombstone.location,
  }, {
    material_id: beforePublicTarget.material_id,
    name: beforePublicTarget.name,
    rel_path: beforePublicTarget.rel_path,
    type: beforePublicTarget.type,
    unit: beforePublicTarget.unit,
    unit_count: beforePublicTarget.unit_count,
    is_ocr: beforePublicTarget.is_ocr,
    origin: beforePublicTarget.origin,
    ref_id: beforePublicTarget.ref_id,
    location: beforePublicTarget.location,
  }, "tombstone retains full identity metadata");
  assert.deepEqual({
    material_id: actualTombstone.material_id,
    name: actualTombstone.name,
    rel_path: actualTombstone.rel_path,
    type: actualTombstone.type,
    unit: actualTombstone.unit,
    unit_count: actualTombstone.unit_count,
    is_ocr: actualTombstone.is_ocr,
    origin: actualTombstone.origin,
    ref_id: actualTombstone.ref_id,
  }, {
    material_id: target.material_id,
    name: target.name,
    rel_path: target.rel_path,
    type: target.type,
    unit: target.unit,
    unit_count: target.unit_count,
    is_ocr: target.is_ocr,
    origin: target.origin,
    ref_id: target.ref_id,
  }, "tombstone matches raw persisted target identity");
  assert.equal(actualTombstone.status, "removed", "tombstone status");
  assert.equal(actualTombstone.chars, null, "tombstone chars");
  assert.equal(actualTombstone.stale_ocr, false, "tombstone stale OCR");
  assert.equal(actualTombstone.error, null, "tombstone error");
  assert.deepEqual(actualTombstone.pages_need_ocr, [], "tombstone need OCR pages");
  assert.deepEqual(actualTombstone.pages_mixed, [], "tombstone mixed pages");

  assert.deepEqual(sourceSnapshot(prepared), sourceBefore, "external TXT bytes and mtime unchanged");
  const taskDir = path.join(ready.case_path, "工作区", "任务");
  if (fs.existsSync(taskDir)) {
    assert.deepEqual(fs.readdirSync(taskDir), [], "task directory remains empty");
  }
  const registry = readJson(path.join(ready.appdata, "cases.json"));
  assert.equal(registry.cases.length, 1, "single exact case registration");
  assert.equal(registry.cases[0].case_id, ready.setup.case_id, "registered case id");
  assert.equal(path.resolve(registry.cases[0].root), path.resolve(ready.case_path), "registered case root");

  const shutdown = await waitForShutdown(root, ready.requested_seconds);
  assert.equal(shutdown.final.outcome, "COMPLETED_FOR_ROOT_REVIEW", "final outcome");
  assert.equal(shutdown.final.failure_code, null, "no final failure");
  assert.equal(shutdown.final.source_unchanged, true, "source unchanged after cleanup");
  assert.equal(shutdown.final.protocol.protocol_complete, true, "remove protocol complete");
  for (const key of ["default", "false", "true"]) {
    assert.equal(shutdown.final.protocol[`pre_remove_list_${key}_ok`], 1,
      `pre-remove ${key} list counted`);
    assert.equal(shutdown.final.protocol[`post_remove_list_${key}_ok`], 1,
      `post-remove ${key} list counted`);
  }
  assert.equal(shutdown.final.protocol.pre_remove_list_ok, 3,
    "three pre-remove material lists");
  assert.equal(shutdown.final.protocol.post_remove_list_ok, 3,
    "three post-remove material lists");
  assert.equal(shutdown.final.protocol.read_counts["/api/materials"], 6,
    "guarded material lists reached native exactly six times");
  assert.equal(shutdown.final.protocol.read_ok["/api/materials"], 6,
    "six native material lists completed");
  assert.deepEqual(shutdown.final.protocol.post_remove_list_default, remainingRows,
    "terminal default list evidence");
  assert.deepEqual(shutdown.final.protocol.post_remove_list_false, remainingRows,
    "terminal false list evidence");
  assert.deepEqual(shutdown.final.protocol.post_remove_list_true,
    sortedRows([...remainingRows, expectedTombstone]),
    "terminal true list evidence");
  assert.deepEqual(shutdown.final.cleanup && {
    server_task_done: shutdown.final.cleanup.server_task_done,
    listener_closed: shutdown.final.cleanup.listener_closed,
    net_client_closed: shutdown.final.cleanup.net_client_closed,
    product_logs_closed: shutdown.final.cleanup.product_logs_closed,
  }, {
    server_task_done: true,
    listener_closed: true,
    net_client_closed: true,
    product_logs_closed: true,
  }, "owned cleanup");
  assert.equal(shutdown.closed.event_loop_closed, true, "event loop closed");

  process.stdout.write(`${JSON.stringify({
    ok: true,
    backend_guard_only: true,
    not_gui_acceptance: true,
    case_id: ready.setup.case_id,
    removed: [TARGET],
    remaining: REMAINING,
    tombstone: true,
    pre_remove_default_false_true_all_parsed: true,
    post_remove_default_false_two: true,
    post_remove_true_three: true,
    per_request_optin_binding: true,
    ref_root_live: true,
    source_bytes_mtime_unchanged: true,
    duplicate_auth_denied_both_orders: true,
    natural_cleanup: true,
  })}\n`);
}

main().catch((error) => {
  const message = String(error?.message ?? error)
    .replaceAll(process.env.LB_REF_REMOVE_GUI_ROOT ?? "", "<run-root>");
  process.stderr.write(`probe failed: ${message}\n`);
  process.exitCode = 1;
});
