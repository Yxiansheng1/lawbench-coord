# B Batch3 两处字面量修补交回

状态：已完成令内允许的源码修改。

## 修改内容

1. `service/lawbench/app.py`
   - 生产导入改为 `from .remote import RemoteAccess`。
   - 对应 `st.remote` 构造器注释改为说明由 `RemoteAccess` 监管自带 EasyTier。
   - 运行期、生命周期、getter、OCR、Retainer 等代码未改动。

2. `service/lawbench/remote.py`
   - 仅将 `DEFAULT_CORE_DIR` 从 `REPO_ROOT / "tools" / "easytier"` 改为 `REPO_ROOT / "easytier"`。
   - 同行注释改为 `<install>\easytier`。
   - 其他函数、类体、`core_args`、启动参数、转发/网络名/环境变量处理保持原样。
   - `DetectionOnlyRemoteAccess` 保留，但不再作为生产别名使用。

3. `service/tests/test_owner_runtime_detection_batch2.py`
   - 在既有 detector 导入旁增加 `RemoteAccess` 导入。
   - 生产别名断言改为 `assert app.RemoteAccess is RemoteAccess`。
   - detector 断言、输入、fixture 和测试体未改动。

## 验证边界

按正式执行令的特别验证禁区，本次未运行运行时、测试、解析器、编译、pytest、GUI、HTTP、模型、构建或自检，也未执行 Python 或 `ast.parse`。本次未新增文件到产品目录，未记录或使用任何真实网络密钥。

## Git 与运行约束

Git 全程只读且未执行任何 Git 命令；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。未联系其他聊天，未更换 API，未变更沙箱、审批或 ACL，未处理或拆分 writer 锁。
