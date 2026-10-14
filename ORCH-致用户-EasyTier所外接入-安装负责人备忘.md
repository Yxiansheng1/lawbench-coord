# 连越律师工作台 · 所外接入（EasyTier）· 安装负责人备忘

给律师的说明见《所外使用说明（EasyTier）》，本页只给安装负责人。

## 1. 发给律师前要先做

1. **换正式密钥**：现用的是测试密钥（曾出现在聊天记录里）。6000D、395、中转节点三处一起换，只停一次网，约半小时；操作单由开发方出。
2. 中转节点按方案 V2 加固。
3. 密钥只当面或电话给律师；离职、换机、泄露就整网换一次密钥（现阶段没有按人作废的办法）。

## 2. 律师拿到的三项接入信息

| 项 | 值 |
|---|---|
| 网络名称 | `lawbench` |
| 网络密钥 | 换正式密钥后的那把（不写在任何文件里） |
| 中转节点 | `tcp://<阿里云中转 IP>:11010`（见 `deploy\easytier\README.md`） |

律师端虚拟 IP 用自动分配，不手填；`10.126.126.1`（6000D）、`.3`（395）已占用。

## 3. 客户端安装包（官方，v2.6.4，与服务器同版本）

下载页 https://github.com/EasyTier/EasyTier/releases/tag/v2.6.4 ，展开 Assets。下载后核 sha256 再拷给律师：


| 给谁 | 文件 | 大小 | sha256 |
|---|---|---|---|
| Windows（绝大多数电脑） | `easytier-gui_2.6.4_x64-setup.exe` | 10.4 MB | `0f92d378658fe5b5b150f6dbd06c0069b7e9c10e2dc127bcac6149f5185b5678` |
| Windows（ARM 笔记本，少见） | `easytier-gui_2.6.4_arm64-setup.exe` | 9.23 MB | `2b029f86cee30cdb64c8243a3bf8eabba829a682fa6e119ae5ace733f2b9e283` |
| Mac（Apple 芯片） | `easytier-gui_2.6.4_aarch64.dmg` | 12.2 MB | `29358d4b565f890b872c72092aa6391636700aae229b3a6baedaf9544b1d1407` |

```powershell
Get-FileHash .\easytier-gui_2.6.4_x64-setup.exe -Algorithm SHA256
```

## 4. 律师装完怎么验

EasyTier 状态绿、分到 `10.126.126.x`；工作台设置里"测试连接"显示"已连接（所外）"。不通时让律师截 EasyTier 状态页 + 工作台提示两张图。
