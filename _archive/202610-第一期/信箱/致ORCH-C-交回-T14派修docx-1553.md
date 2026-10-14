# 致 ORCH · 线 C 交回 · T14 派修：导出 docx 的"兼容性模式"（令 1541）

- 提交：`5bf892d`，一个 `T15:` 提交，基于 main `8940bb1`。
- 交付说明：`docs\plan\evidence\T15\交付说明.md` 末尾新增一节。

## 原因（是我们自己生成的文件，不是 WPS / Word 版本差异）
- **导出**：内置模板 `文书.docx`、`合同.docx` 由 pandoc 自带的 reference.docx 改出，`settings.xml` 里**没写 `w:compat`**，Word 按 12（Word 2007）显示"兼容性模式"。pandoc 原样沿用参考模板的 `settings.xml`（实测），所以导出的成果也是 12。T14 样本 `刑事阅卷笔录-v1.docx` 就是这样。
- **归档（T23 共用）**：没有律所模板时，python-docx 默认底板写的是 **14**（Word 2010），生成的立卷申请书、结案报告、情况说明同样会进"兼容性模式"。

## 修复
- 新增 `export\compat.py` 的 `set_compat15`：把 compatibilityMode 设成 15，其余 compat 项保留；插入位置按 CT_Settings 规定的顺序。
- 两个内置模板用 `make_export_templates.py` 重新生成。逐部件比对，只有 `settings.xml` 变了。
- 归档只对默认底板生成的三种文书设 15；**律所模板生成的保留它自己的设置**。
- 修订版是在律师的原 docx 上就地改，`settings.xml` 照原文件，修订和批注的逻辑都没动。
- 律所模板本身是旧模式时：程序不改模板。在 Word 里打开副本，"文件 → 信息 → 转换"后另存，再在设置里指定这份副本（交付说明里写了做法）。

## 验证（供亲核）
- 用 python-docx 读 `settings.xml` 的用例共 3 条：
  - 导出：两个模板，加上文书、合同、不选模板三种导出，结果都是 15；
  - `w:compat` 的插入位置，以及 14 改成 15 时其余项保留；
  - 归档：默认底板生成的三种文书是 15，律所模板生成的保留 14。
- 红绿：`mutations-兼容模式.txt`，四处改坏全红。
- 回归：`pytest-兼容模式.txt`，test_export + test_redline + test_archive 86 passed（T15 全部用例都在这两个文件里）。
- 真 Word 16.0 后台只读打开，读 `Document.CompatibilityMode`：旧样本 **12**，修复后新导出 **15**（`word-兼容模式核对.txt`）。两份都不含外链。
- 已经导出的旧成果不会自动改，重新导出一次就是 15。
