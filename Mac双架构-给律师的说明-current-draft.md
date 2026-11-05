> 当前不可交付：2026-11-04T01:02:05.092671+08:00 Intel 签名失败，三个包共同暂缓。下文仅为安装说明草稿，不代表三平台均已验收。

# 连越律所AI工作台 1.0.0 安装与使用说明

（内部待验证稿：三个安装包须共同验收后再发给律师。）

| 平台 | 安装包 | 最低系统要求 |
|---|---|---|
| Windows x64 | 连越律所AI工作台-1.0.0-win-x64.exe | Windows 10/11 64位 |
| Mac，苹果M系列 | 文件名含 mac-arm64 的1.0.0 dmg | macOS 14 Sonoma或更新 |
| Mac，Intel芯片 | 文件名含 mac-x64 的1.0.0 dmg | macOS 14 Sonoma或更新 |

Mac可在“苹果菜单→关于本机”查看芯片和系统版本。两个Mac安装包不能混用，macOS 13及更早版本不在支持范围。

**Windows安装**：双击exe。出现“Windows已保护你的电脑／未知发布者”时，点击“更多信息”→“仍要运行”，按向导安装。

**macOS安装**：打开dmg，将“连越律所AI工作台.app”拖入“应用程序”。首次打开若被拦，右键点击工作台→“打开”→再次点击“打开”。Mac版采用ad-hoc签名，未做Apple公证；首次放行步骤比Windows多。

若仍被拦，由律所内部对接人指导，在终端执行：

```sh
xattr -dr com.apple.quarantine "/Applications/连越律所AI工作台.app"
```

管理员需要准备共享Skill目录时，执行一次：

```sh
sudo mkdir -p "/Library/Application Support/lawbench/skills" && sudo chmod 755 "/Library/Application Support/lawbench/skills"
```

**验证范围与已知限制**

- Mac本轮仅在CI云端构建机完成自动安装、启动、首屏和服务接口冒烟；没有人工Mac实机验收。最低macOS 14来自随包依赖的平台要求，未在macOS 14机器另做实测。
- 随包OCR推理库ONNX Runtime：Windows及苹果芯片Mac为1.24.4，Intel Mac为1.23.2。版本差异可能影响模型加载兼容性、识别输出或性能；本轮未检验真实图像OCR效果、手写、倾斜／旋转和多页复杂文档。
- Mac已随包提供EasyTier，所外接入连通性本轮未验证。所外接入使用统一网络密钥，尚未按律师分别发放。
- 案件wiki需手动生成；部分复杂Excel公式可能不支持。发票整理工具当前仅Windows可用。
- Windows版未做代码签名；Mac版未做Apple公证，按上文步骤首次放行。

出现问题请联系律所内部对接人，提供系统版本、芯片类型、报错截图和操作步骤。不要在故障反馈中附接入码或案卷材料。
