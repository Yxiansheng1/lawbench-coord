import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APPROVED = Object.freeze({
  old: Object.freeze({
    host: String.raw`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DefenseReadOrderPrivateBuild-20261031-231143\private-output-20261031-231753\profile-node_modules\lawbench-dsh\lib\host.js`,
    sha256: "ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba",
    expectedPassed: 2,
    expectedFailed: 2,
  }),
  new: Object.freeze({
    host: String.raw`D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211\private-output-20261101-005415\profile-node_modules\lawbench-dsh\lib\host.js`,
    sha256: "c20145ec00e0a3a48da996946cd31c2a4089361ec187cb608480c3ee94a472b4",
    expectedPassed: 4,
    expectedFailed: 0,
  }),
});

const TASK_ID = "T-20261101004000-a001";
const DRAFT_NAME = "answer.md";
const DRAFT_TITLE = "synthetic answer";
const DRAFT_TEXT = "# answer\nsecond line\n";
const NO_TASK = '没有找到这个任务的结果，请到"成果"里查看。';
const VALID_STATUS = "completed";
const SESSION_ID = "sess-2026-0001";
const MODEL_CALLS = 5;
const LIMIT = 8;
const DRAFT_VERSION = 2;
const TMP_PREFIX = "lawbench-t14-compiled-";

function sha256File(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
}

function writeText(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, value, { encoding: "utf8", flag: "wx" });
}

function taskDirectory(caseRoot) {
  return path.join(caseRoot, "tasks", TASK_ID);
}

function draftPath(caseRoot) {
  return path.join(taskDirectory(caseRoot), "drafts", DRAFT_NAME);
}

function validResult() {
  return {
    status: VALID_STATUS,
    model_calls: MODEL_CALLS,
    draft: {
      name: DRAFT_NAME,
      title: DRAFT_TITLE,
      version: DRAFT_VERSION,
    },
  };
}

function writeValidResultAndDraft(caseRoot) {
  writeJson(path.join(taskDirectory(caseRoot), "result.json"), validResult());
  writeText(draftPath(caseRoot), DRAFT_TEXT);
}

function writeTask(caseRoot) {
  writeJson(path.join(taskDirectory(caseRoot), "task.json"), {
    session_id: SESSION_ID,
    limit: LIMIT,
  });
}

function assertion(label, test) {
  try {
    test();
    return { label, pass: true };
  } catch {
    return { label, pass: false };
  }
}

function thrownDetails(error) {
  return {
    name: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? error.message : String(error),
  };
}

function checkLog(logs, expectedLevel, expectedCode, expectedDraft) {
  return [
    assertion("one task.answer_read event", () => {
      assert.equal(logs.length, 1);
      assert.equal(logs[0][0], expectedLevel);
      assert.equal(logs[0][1], "task.answer_read");
    }),
    assertion(`log level ${expectedLevel}`, () => {
      assert.equal(logs[0][0], expectedLevel);
    }),
    assertion(
      expectedCode === undefined
        ? "log code undefined"
        : `log code ${expectedCode}`,
      () => {
        assert.equal(logs[0][2]?.code, expectedCode);
      },
    ),
    assertion(`log draft flag ${String(expectedDraft)}`, () => {
      assert.equal(logs[0][2]?.draft, expectedDraft);
    }),
  ];
}

async function invokeOriginal(method, caseRoot, logs) {
  const receiver = Object.freeze({
    log(...event) {
      logs.push(event);
    },
  });
  return method.call(receiver, { root: caseRoot, task_id: TASK_ID });
}

async function runCase(method, tmpRoot, caseId, setup, verify) {
  const caseRoot = path.join(tmpRoot, caseId);
  const logs = [];
  let thrown = null;
  let assertions = [];

  try {
    mkdirSync(caseRoot, { recursive: false });
    setup(caseRoot);
    let result;
    try {
      result = await invokeOriginal(method, caseRoot, logs);
    } catch (error) {
      thrown = thrownDetails(error);
      return { case_id: caseId, pass: false, assertions, thrown };
    }
    assertions = verify(result, logs, caseRoot);
  } catch (error) {
    thrown = thrownDetails(error);
    return { case_id: caseId, pass: false, assertions, thrown };
  }

  return {
    case_id: caseId,
    pass: assertions.length > 0 && assertions.every((item) => item.pass),
    assertions,
    thrown,
  };
}

function verifyResultNull(result, logs) {
  return [
    assertion("result null returns ok false", () => {
      assert.equal(result?.ok, false);
    }),
    assertion("result null code TASK_NOT_FOUND", () => {
      assert.equal(result?.error?.code, "TASK_NOT_FOUND");
    }),
    assertion("result null exact NO_TASK message", () => {
      assert.equal(result?.error?.message, NO_TASK);
    }),
    ...checkLog(logs, "warn", "TASK_NOT_FOUND", undefined),
  ];
}

function verifyValidAnswer(result, logs, caseRoot, hasTask) {
  return [
    assertion("valid answer returns ok true", () => {
      assert.equal(result?.ok, true);
    }),
    assertion(`status ${VALID_STATUS}`, () => {
      assert.equal(result?.value?.status, VALID_STATUS);
    }),
    assertion(
      hasTask ? `session ${SESSION_ID}` : "session null",
      () => {
        assert.equal(result?.value?.session_id, hasTask ? SESSION_ID : null);
      },
    ),
    assertion(`used ${MODEL_CALLS}`, () => {
      assert.equal(result?.value?.used, MODEL_CALLS);
    }),
    assertion(hasTask ? `limit ${LIMIT}` : "limit null", () => {
      assert.equal(result?.value?.limit, hasTask ? LIMIT : null);
    }),
    assertion(`draft title ${DRAFT_TITLE}`, () => {
      assert.equal(result?.value?.draft?.title, DRAFT_TITLE);
    }),
    assertion(`draft version ${DRAFT_VERSION}`, () => {
      assert.equal(result?.value?.draft?.version, DRAFT_VERSION);
    }),
    assertion("draft exact path", () => {
      assert.equal(result?.value?.draft?.path, draftPath(caseRoot));
    }),
    assertion("draft exact text", () => {
      assert.equal(result?.value?.draft?.text, DRAFT_TEXT);
    }),
    assertion("draft truncated false", () => {
      assert.equal(result?.value?.draft?.truncated, false);
    }),
    ...checkLog(logs, "info", undefined, true),
  ];
}

function validateArguments() {
  const phase = process.argv[2];
  const resultFile = process.argv[3];
  assert.ok(
    phase === "old" || phase === "new",
    "phase must be exactly old or new",
  );
  assert.ok(resultFile, "result file is required");
  assert.ok(path.isAbsolute(resultFile), "result file must be absolute");
  assert.ok(
    path.basename(resultFile).toLowerCase().includes("result"),
    "result file basename must contain result",
  );
  assert.ok(
    statSync(path.dirname(resultFile)).isDirectory(),
    "result file parent must already exist",
  );
  return { phase, resultFile };
}

function cleanupOwnedTmp(root) {
  const resolvedRoot = path.resolve(root);
  const resolvedTmp = path.resolve(tmpdir());
  assert.equal(path.dirname(resolvedRoot), resolvedTmp);
  assert.ok(path.basename(resolvedRoot).startsWith(TMP_PREFIX));
  const before = lstatSync(resolvedRoot);
  assert.ok(before.isDirectory());
  assert.equal(before.isSymbolicLink(), false);
  rmSync(resolvedRoot, { recursive: true, force: false, maxRetries: 0 });
  return !existsSync(resolvedRoot);
}

async function main() {
  const { phase, resultFile } = validateArguments();
  const selected = APPROVED[phase];
  const report = {
    phase,
    cases: [],
    counts: {
      passed: 0,
      failed: 0,
      expectedPassed: selected.expectedPassed,
      expectedFailed: selected.expectedFailed,
    },
    cleanup: false,
  };
  let tmpRoot = null;
  let thrown = null;

  try {
    assert.equal(
      sha256File(selected.host),
      selected.sha256,
      "selected host SHA mismatch",
    );
    const imported = await import(pathToFileURL(selected.host).href);
    assert.equal(
      typeof imported.LawbenchRemote,
      "function",
      "LawbenchRemote export missing",
    );
    const method = imported.LawbenchRemote.prototype.taskAnswer;
    assert.equal(
      typeof method,
      "function",
      "original taskAnswer prototype method missing",
    );

    tmpRoot = mkdtempSync(path.join(tmpdir(), TMP_PREFIX));
    report.cases.push(
      await runCase(
        method,
        tmpRoot,
        "result-null",
        (caseRoot) => {
          writeJson(path.join(taskDirectory(caseRoot), "result.json"), null);
        },
        verifyResultNull,
      ),
    );
    report.cases.push(
      await runCase(
        method,
        tmpRoot,
        "task-null",
        (caseRoot) => {
          writeValidResultAndDraft(caseRoot);
        },
        verifyResultNull,
      ),
    );
    report.cases.push(
      await runCase(
        method,
        tmpRoot,
        "valid-result-task-draft",
        (caseRoot) => {
          writeValidResultAndDraft(caseRoot);
          writeTask(caseRoot);
        },
        (result, logs, caseRoot) =>
          verifyValidAnswer(result, logs, caseRoot, true),
      ),
    );
    report.cases.push(
      await runCase(
        method,
        tmpRoot,
        "missing-optional-task",
        (caseRoot) => {
          writeValidResultAndDraft(caseRoot);
        },
        (result, logs, caseRoot) =>
          verifyValidAnswer(result, logs, caseRoot, false),
      ),
    );
  } catch (error) {
    thrown = thrownDetails(error);
  } finally {
    if (tmpRoot !== null) {
      try {
        report.cleanup = cleanupOwnedTmp(tmpRoot);
      } catch (error) {
        report.cleanup = false;
        if (thrown === null) {
          thrown = thrownDetails(error);
        }
      }
    }
  }

  report.counts.passed = report.cases.filter((item) => item.pass).length;
  report.counts.failed = report.cases.filter((item) => !item.pass).length;
  if (thrown !== null) {
    report.counts.failed += 1;
  }

  const matchesExpected =
    thrown === null &&
    report.cases.length === selected.expectedPassed + selected.expectedFailed &&
    report.counts.passed === selected.expectedPassed &&
    report.counts.failed === selected.expectedFailed;

  const output = {
    ...report,
    counts: { ...report.counts, matchesExpected },
    ...(thrown === null ? {} : { thrown }),
  };

  writeFileSync(resultFile, `${JSON.stringify(output, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });

  if (!matchesExpected) {
    process.exitCode = 1;
  }
}

await main();
