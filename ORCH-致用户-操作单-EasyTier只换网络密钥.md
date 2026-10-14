# 操作单 · EasyTier 只换网络密钥（给律所负责人）

- 执行人：**律所负责人**。新密钥在律所的服务器上生成、只存律所的密码管理器，**开发方（包括写这张单的人）全程不接触密钥**；做完只需回一句"换好了"。
- 目的：把现在的测试密钥换成正式密钥。**只换密钥**，不开 secure-mode、不动中转节点（中转不持密钥，不用改）。
- 影响：所外访问中断约 15 分钟；所内（局域网地址）不受影响。建议下班后做。
- 涉及：6000D（Linux）→ 395（Windows）→ 以后每台律师电脑。顺序不要反。直接在两台主机上操作（坐在机器前），不需要远程登录。
- **密钥不要粘进聊天、信箱、命令历史**；凡要输密钥的地方都用"屏幕不显示"的方式。
- 依据：`deploy\easytier\操作单-上线前.md` A3①、A3②'，去掉加固部分。

---

## 0. 开始前（5 分钟）

0.1 看 395 的 EasyTier 现在是哪种装法（决定第 2 步走 2A 还是 2B）。在 395 上：开始菜单搜"PowerShell"，右键**以管理员身份运行**，然后：

```powershell
sc.exe qc easytier | Select-String BINARY_PATH_NAME
```
- 输出里有 `--config-file C:\EasyTier\lawbench.toml` → **2A**（密钥在配置文件里）。
- 输出里有 `--network-secret` → **2B**（密钥还在服务参数里，顺便挪进配置文件）。
- 报"服务不存在" → 把这行输出发我，先别往下。

---

## 1. 6000D：生成正式密钥并重启（在 6000D 上打开终端，用 `bld` 账号；命令带 `sudo` 时会要一次这台机器的密码）

```bash
# 1.1 备份旧密钥和服务文件（回退用）
sudo cp /etc/easytier.secret /root/easytier.secret.bak-$(date +%Y%m%d)
sudo cp /etc/systemd/system/easytier-gw.service /root/easytier-gw.service.bak-$(date +%Y%m%d)
```
```bash
# 1.2 生成 48 位随机密钥，直接写进文件（屏幕上不会显示密钥）
openssl rand -base64 36 | tr -d '\n/+=' | head -c 48 | sudo tee /etc/easytier.secret >/dev/null
sudo chown root:root /etc/easytier.secret && sudo chmod 600 /etc/easytier.secret
sudo stat -c '%a %U %s' /etc/easytier.secret
```
预期：`600 root 48`。

```bash
# 1.3 把密钥存进律所密码管理器（条目"lawbench 网络密钥"）：显示一次，复制走，立刻清屏
sudo cat /etc/easytier.secret; clear
```
后面 395 和每台客户端都从密码管理器取这一串。

```bash
# 1.4 重启（⛔ 从这里起所外中断）
sudo systemctl restart easytier-gw && sleep 3 && systemctl is-active easytier-gw
sudo journalctl -u easytier-gw -n 10 --no-pager | grep -i error || echo "no error"
```
预期：`active`、`no error`。

回退：`sudo cp /root/easytier.secret.bak-<日期> /etc/easytier.secret && sudo systemctl restart easytier-gw`

---

## 2. 395：换成同一把密钥（在 395 上，用第 0 步那个管理员 PowerShell 窗口）

### 2A 已是配置文件装法

```powershell
# 2A.1 备份
Copy-Item C:\EasyTier\lawbench.toml C:\EasyTier\lawbench.toml.bak
icacls C:\EasyTier\lawbench.toml.bak /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" | Out-Null
```
```powershell
# 2A.2 换密钥那一行（交互输入，屏幕不显示）
$s = Read-Host "粘贴新密钥" -AsSecureString
$k = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
$cfg = "C:\EasyTier\lawbench.toml"
(Get-Content $cfg -Encoding utf8) -replace '^network_secret = .*$', ('network_secret = "' + $k + '"') | Set-Content -Encoding utf8 $cfg
Remove-Variable k, s
Select-String -Path $cfg -Pattern '^network_secret' | ForEach-Object { $_.Line.Length }
```
预期：输出一个数字（约 68），说明那行已换；不要把那行打印出来。

```powershell
# 2A.3 检查配置、重启、看对端
C:\EasyTier\easytier-core.exe --config-file C:\EasyTier\lawbench.toml --check-config
Restart-Service easytier; Start-Sleep 5; (Get-Service easytier).Status
C:\EasyTier\easytier-cli.exe peer
```
预期：check-config 无报错；`Running`；peer 列表里有 `firm-gw`（10.126.126.1）。

回退：`Copy-Item C:\EasyTier\lawbench.toml.bak C:\EasyTier\lawbench.toml -Force; Restart-Service easytier`（6000D 也要一起回退）。

### 2B 密钥还在服务参数里（顺便改成配置文件装法）

```powershell
# 2B.1 把现在的参数存起来（回退用；里面有旧密钥，做完要删）
New-Item -ItemType Directory -Force C:\EasyTier\backup | Out-Null
icacls C:\EasyTier\backup /inheritance:r /grant:r "*S-1-5-32-544:(OI)(CI)F" "*S-1-5-18:(OI)(CI)F" | Out-Null
sc.exe qc easytier > C:\EasyTier\backup\service-before.txt
Select-String -Path C:\EasyTier\backup\service-before.txt -Pattern 'tcp-whitelist'
```
记下 `--tcp-whitelist` 后面的端口（现在应是 `9000,8743,22`）。

```powershell
# 2B.2 写配置文件（先建文件、收紧权限，再写密钥；端口按上一步记下的填）
$cfg = "C:\EasyTier\lawbench.toml"
New-Item -ItemType File -Force $cfg | Out-Null
icacls $cfg /inheritance:r /grant:r "*S-1-5-32-544:F" "*S-1-5-18:F" | Out-Null
$s = Read-Host "粘贴新密钥" -AsSecureString
$k = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
@"
hostname = "node-395"
ipv4 = "10.126.126.3"
dhcp = false
listeners = ["udp://0.0.0.0:11010"]
tcp_whitelist = ["9000", "8743", "22"]

[network_identity]
network_name = "lawbench"
network_secret = "$k"

[[peer]]
uri = "tcp://47.107.140.75:11010"
"@ | Set-Content -Encoding utf8 $cfg
Remove-Variable k, s
icacls $cfg
C:\EasyTier\easytier-core.exe --config-file $cfg --check-config
```
预期：icacls 只有 `BUILTIN\Administrators:(F)` 和 `NT AUTHORITY\SYSTEM:(F)` 两行；check-config 无报错。

```powershell
# 2B.3 服务改为读配置文件（参数里不再有密钥），重启
sc.exe config easytier binPath= "C:\EasyTier\easytier-core.exe --config-file C:\EasyTier\lawbench.toml"
sc.exe qc easytier | Select-String BINARY_PATH_NAME
Restart-Service easytier; Start-Sleep 5; (Get-Service easytier).Status
C:\EasyTier\easytier-cli.exe peer
```
预期：BINARY_PATH_NAME 只有 `--config-file`；`Running`；peer 里有 `firm-gw`。

回退：把 `C:\EasyTier\backup\service-before.txt` 里 `BINARY_PATH_NAME` 那一行原样填进 `sc.exe config easytier binPath= "…"`，`Restart-Service easytier`（6000D 一起回退）。
全部通过后：`Remove-Item C:\EasyTier\backup -Recurse`（里面有旧密钥）。

---

## 3. 验收（任意一台装了 EasyTier 客户端的电脑，切到手机热点）

按《所外使用说明（EasyTier）》用新密钥接入；状态绿、分到 `10.126.126.x` 后，打开工作台，设置里点"测试连接"，两项显示"已连接（所外）"即通。

说明：换密钥后，**以前用旧密钥接入过的电脑全部掉线**（包括开发方的电脑），要用新密钥重新接一次；这是预期中的。

---

## 4. 收尾

1. 旧密钥作废：6000D 上 `sudo rm /root/easytier.secret.bak-<日期>`（服务文件备份可留）；395 删 `lawbench.toml.bak` 或 `backup` 目录；聊天记录、笔记里的旧密钥删掉。
2. 回开发方一句"换好了"（不说密钥），开发方把变更登记进仓库文档（只写存放位置）。
3. 以后给律师的接入信息里，密钥就是密码管理器"lawbench 网络密钥"这一条；开发方的电脑要接入时，由律所负责人当面给。
