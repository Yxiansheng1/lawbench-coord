# T18 QuestionBatch Native Case — 交回件（B 线）

- 任务令：D:\Lawbeach\lawbench-coord\ORCH-B-T18QuestionBatchNativeCase-20261101-131443.md
- 输入绑定：D:\Lawbeach\lawbench-coord\T18QuestionBatchNativeCase-20261101-131443Input\binding-approved.json
- 状态：**AUTHORED_NOT_RUN**（runtime = 0，未执行任何运行/测试/HTTP/模型调用）
- 完成时间：2026-11-01（Asia/Taipei）

## 1. 交付产物（destination）

Consumer root（新，未复用任何 served run root）：
$(@{old_mts=D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18BoundedReadNativeCase-20261101-125036\native-defense-opinion.mts; old_py=D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18BoundedReadNativeCase-20261101-125036\b-service-defense-opinion.py; destination=D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18QuestionBatchNativeCase-20261101-131443; oldblock=const APPROVED_RUNTIME_PINS = {
  "current-compiled-agent": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18BoundedReadPrivateBuild-20261101-124200\\private-output-20261101-122346\\profile-node_modules\\lawbench-dsh\\lib\\agent.js",
    "bytes": 569980,
    "sha256": "47cf4cb2de59bbc27a30c656fd12d3eb68fb8675ca311393b44ab0a9a0abe03b"
  },
  "current-compiled-host": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18BoundedReadPrivateBuild-20261101-124200\\private-output-20261101-122346\\profile-node_modules\\lawbench-dsh\\lib\\host.js",
    "bytes": 905178,
    "sha256": "19c21b8db04adf387a4f9925e11685106aa979b4683c32684eb67c418393297a"
  },
  "current-compiled-package": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18BoundedReadPrivateBuild-20261101-124200\\private-output-20261101-122346\\profile-node_modules\\lawbench-dsh\\package.json",
    "bytes": 1257,
    "sha256": "3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794"
  },
  "current-compiled-manifest": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18BoundedReadPrivateBuild-20261101-124200\\private-output-20261101-122346\\manifest.json",
    "bytes": 58594,
    "sha256": "e4ac06d961ef93085fecb7ce60f658c0d65db2a6ea79c5df7156f2eef1ed1d95"
  }
} as const; newblock=const APPROVED_RUNTIME_PINS = {
  "current-compiled-agent": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18QuestionBatchPrivateBuild-20261101-131022\\private-output-20261101-131312\\profile-node_modules\\lawbench-dsh\\lib\\agent.js",
    "bytes": 570196,
    "sha256": "44eacd92e427ca641404bd75da1f48ad26c2bcf6250d3812d0db83e13954f9b8"
  },
  "current-compiled-host": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18QuestionBatchPrivateBuild-20261101-131022\\private-output-20261101-131312\\profile-node_modules\\lawbench-dsh\\lib\\host.js",
    "bytes": 905178,
    "sha256": "19c21b8db04adf387a4f9925e11685106aa979b4683c32684eb67c418393297a"
  },
  "current-compiled-package": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18QuestionBatchPrivateBuild-20261101-131022\\private-output-20261101-131312\\profile-node_modules\\lawbench-dsh\\package.json",
    "bytes": 1257,
    "sha256": "3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794"
  },
  "current-compiled-manifest": {
    "path": "D:\\Lawbeach\\lawbench-A\\docs\\plan\\evidence\\T18\\T18QuestionBatchPrivateBuild-20261101-131022\\private-output-20261101-131312\\manifest.json",
    "bytes": 58598,
    "sha256": "5540da33474d644a0065cca448adc9f7986a55d414bf7f183c9cacecc16613c8"
  }
} as const; expected_consumer=; expected_bService=; ready_manifest=D:\Lawbeach\lawbench-coord\T18QuestionBatchNativeCase-20261101-131443Input\literalfixed-inputs-ready.json; expected_manifest=}.destination)

| 目标 | 字节 | SHA-256 | 与期望一致 |
|---|---|---|---|
| native-defense-opinion.mts | 156901 | 2dde13b432a4c941c306d5a96a81f67ef56bb8e24d4867d0a1ca0ab2f4751822 | 是 |
| b-service-defense-opinion.py | 53710 | 59b91aa7fb24a926961c8d7f950750efedf49ed31fdbd214d8a34b94765e4809 | 是 |
| literalfixed-inputs.json | 12031 | cafc3ff9519a47dde63b858e5b7e37aece71ea8f6cb93627842b498e1ce45917 | 是 |

期望值来源：binding-approved.json 的 expected_consumer / expected_bService / expected_manifest，三项 SHA-256 与字节数逐项相等。

## 2. 做法与改动半径

- 旧 MTS（T18BoundedReadNativeCase-20261101-125036\native-defense-opinion.mts，156893 B，SHA 4f62aaaffa3e4e63c477d30eab551da7fde30605dc1e097d0812754d203f310f）按字节读取。
- 在旧 MTS 中定位 oldblock（1328 B，纯 ASCII）：出现次数 **恰好 1**，偏移 **4167**。
- 定点替换为 
ewblock（1336 B，纯 ASCII），净增 **8 字节**；其余字节原样保留。
- -service-defense-opinion.py 与 literalfixed-inputs-ready.json 均**按字节原样复制**（byte-exact），未做任何改写。

四个被接受的 compiled pins 已写入新 block：

- current-compiled-agent → T18QuestionBatchPrivateBuild-20261101-131022\private-output-20261101-131312\...\lawbench-dsh\lib\agent.js（570196 B，sha 44eacd92e427ca641404bd75da1f48ad26c2bcf6250d3812d0db83e13954f9b8）
- current-compiled-host → 同 build 的 lib\host.js（905178 B，sha 19c21b8db04adf387a4f9925e11685106aa979b4683c32684eb67c418393297a）
- current-compiled-package → 同 build 的 package.json（1257 B，sha 3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794）
- current-compiled-manifest → 同 build 的 manifest.json（58598 B，sha 5540da33474d644a0065cca448adc9f7986a55d414bf7f183c9cacecc16613c8）

除该 pinned block 外，未改动任何函数、prompt、task、model、temperature 0.6、budget 32+48、Skill、answers、guards、assertions、SDK、disposal 行为。

## 3. 验证证据

单次最终三目标 SHA-256 + 字节数校验全部 MATCH=True；并做一次整根逆向比对：

- 旧文件中 oldblock 出现 1 次；新文件中 oldblock 出现 0 次、
ewblock 出现 1 次。
- 以旧文件 + 新 block 反向重建结果与实际目标文件**逐字节相等**（reconstruct_equals_target=True）。
- 替换点之前 4167 字节**完全相同**，之后全部尾部字节**完全相同**。

结论：改动只落在 pinned block，无夹带改动。

## 4. 禁令遵守情况

- Git 全程只读：未执行 add / commit / rebase / stash / reset / clean / checkout / push，未暂存、未提交。
- 未启动 Node、Python、parser、check、test、build、prepare，未发 HTTP，未调用模型，未开 GUI，未读写凭据，未接触 runtime。
- 复用既有已通过且源码不变的原始证据（旧 MTS / 旧 PY / ready manifest 均按字节复制）；新 consumer root 为全新目录，未复用任何 served run root。
- 协调目录未写入机密（Key、密码、网络密钥、真实案卷内容均无）。

## 5. 遗留问题 / 需主编排决定

- 本次按令**只做 AUTHORED_NOT_RUN**：产出的 native case 与 b-service 脚本**尚未实际运行**，runtime 计数为 0。若后续需要真实执行证据，须由主编排另行下发一次执行批次（本次令明确禁止在此运行）。
- 新 block 中四个 pin 指向 D:\Lawbeach\lawbench-A\...\T18QuestionBatchPrivateBuild-20261101-131022\private-output-20261101-131312\，属 A 线产物；本次未读取、未校验其磁盘实况（令禁其他读取与运行期访问），仅按 binding-approved.json 原样写入。若需校验该 build 的实况，请另行下发。