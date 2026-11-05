// 把会话记录移进系统回收站（T30 删除会话，DSH 补丁 P-28 的 workspace/session-delete；第一期待办 24 重做）。
// 口径与服务里"移除材料"的 service\lawbench\case\trash.py 相同（会话存储是 Node 进程，用不到那份 Python，照它的规则写一份）：
// - Windows：只认本机固定盘（UNC、映射的网络盘、U 盘没有回收站，系统会静默永久删除），SHFileOperationW + FOF_ALLOWUNDO，
//   不弹确认框、不弹出错框；经 PowerShell 调，路径走环境变量，不拼进命令行。长路径前缀 \\?\C:\… 先剥掉（复核 rv-A67 P3-2）。
// - macOS：移到 ~/.Trash（重名加序号）。只认与家目录同卷的位置：外接盘、另一卷、网络盘上的，访达放进该卷自己的废纸篓，
//   这里不复制进家目录（T28 交付说明第 8 节建议 1、3）。
// - 其他系统：不支持。
// 删除会话先调 recycleBinAt 预检（停会话之前），过了才真去移；移失败一律抛错（code 为 NO_RECYCLE_BIN 或 TRASH_FAILED）。
// 这里不记日志、不带路径。
import { execFile } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, renameSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, extname, join } from 'node:path'

export class TrashError extends Error {
  constructor(readonly code: 'NO_RECYCLE_BIN' | 'TRASH_FAILED', message: string) {
    super(message)
    this.name = 'TrashError'
  }
}

/** 去掉长路径前缀：\\?\C:\… → C:\…；\\?\UNC\… 不动（仍是网络路径）。 */
export function plainPath(path: string): string {
  return path.startsWith('\\\\?\\') && !path.toUpperCase().startsWith('\\\\?\\UNC\\') ? path.slice(4) : path
}

/** 盘符写法的本机路径（C:\…，含 \\?\C:\…）；UNC、\\?\UNC\… 不算。 */
export function driveOf(path: string): string | undefined {
  const p = plainPath(path)
  return /^[A-Za-z]:[\\/]/.test(p) ? p.slice(0, 2).toUpperCase() : undefined
}

// 环境变量 LB_TRASH_PATH 是要移的路径（已剥长路径前缀）；LB_TRASH_CHECK=1 时只判盘不移。
// 退出码：0 移好（或判盘通过），2 不是本机固定盘，1 移失败
const PS = `
$p = $env:LB_TRASH_PATH
$d = [System.IO.Path]::GetPathRoot($p)
try { if ((New-Object System.IO.DriveInfo($d)).DriveType -ne 'Fixed') { exit 2 } } catch { exit 2 }
if ($env:LB_TRASH_CHECK -eq '1') { exit 0 }
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public static class LbTrash {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct Op { public IntPtr hwnd; public uint wFunc; public string pFrom; public string pTo; public ushort fFlags; public bool aborted; public IntPtr map; public string title; }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern int SHFileOperationW(ref Op op);
  public static int Recycle(string path) {
    Op op = new Op(); op.wFunc = 3; op.pFrom = path + "\\0\\0"; op.fFlags = 0x0004 | 0x0010 | 0x0040 | 0x0400;
    int rc = SHFileOperationW(ref op);
    return rc != 0 ? rc : (op.aborted ? -1 : 0);
  }
}
"@
if ([LbTrash]::Recycle($p) -ne 0) { exit 1 }
exit 0
`

/** Windows 上真正去判盘、去移的那一步：返回 PowerShell 的退出码。check 为 true 时只判盘。 */
export type Run = (path: string, check: boolean) => Promise<number>

const runPowerShell: Run = (path, check) => new Promise((resolve) => {
  execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', PS],
    { env: { ...process.env, LB_TRASH_PATH: path, LB_TRASH_CHECK: check ? '1' : '0' }, windowsHide: true, timeout: 60_000 },
    (error) => resolve(error ? (typeof (error as { code?: unknown }).code === 'number' ? (error as { code: number }).code : 1) : 0))
})

/** 测试用：替换 Windows 上的 PowerShell 一步、Mac 上的家目录与两个文件操作。 */
export interface TrashDeps {
  readonly platform?: NodeJS.Platform
  readonly run?: Run
  readonly home?: string
  readonly renameSync?: typeof renameSync
  readonly lstatSync?: typeof lstatSync
}

/**
 * 预检（删除会话停会话之前调）：这个位置能不能进回收站。Windows 只认本机固定盘；Mac 只认与家目录同卷
 * （statSync(…).dev 相同）；其他系统不能。路径不在或读不到按不能。
 */
export async function recycleBinAt(path: string, deps: TrashDeps = {}): Promise<boolean> {
  const platform = deps.platform ?? process.platform
  if (platform === 'win32') {
    const p = plainPath(path)
    if (!driveOf(p)) return false
    return (await (deps.run ?? runPowerShell)(p, true)) === 0
  }
  if (platform === 'darwin') {
    try { return statSync(path).dev === statSync(deps.home ?? homedir()).dev } catch { return false }
  }
  return false
}

/** 不跟随链接看这个位置有没有东西：没有为 false；读不到（非 ENOENT，如 TCC 拒绝）抛 TRASH_FAILED，不当空位（T28 建议 2）。 */
function occupied(p: string, lstat: typeof lstatSync): boolean {
  try {
    return lstat(p, { throwIfNoEntry: false }) !== undefined
  } catch {
    throw new TrashError('TRASH_FAILED', 'cannot inspect trash')
  }
}

/** 把一个文件或目录移进回收站。 */
export async function moveToTrash(path: string, deps: TrashDeps = {}): Promise<void> {
  const platform = deps.platform ?? process.platform
  try { lstatSync(path) } catch { throw new TrashError('TRASH_FAILED', 'not found') }
  if (platform === 'win32') {
    const p = plainPath(path)
    if (!driveOf(p)) throw new TrashError('NO_RECYCLE_BIN', 'no recycle bin at this location')
    const rc = await (deps.run ?? runPowerShell)(p, false)
    if (rc === 2) throw new TrashError('NO_RECYCLE_BIN', 'no recycle bin at this location')
    if (rc !== 0) throw new TrashError('TRASH_FAILED', 'recycle failed')
  } else if (platform === 'darwin') {
    const trash = join(deps.home ?? homedir(), '.Trash')
    mkdirSync(trash, { recursive: true })
    const base = basename(path)
    const ext = extname(base)
    const stem = base.slice(0, base.length - ext.length)
    let dst = join(trash, base)
    for (let n = 2; occupied(dst, deps.lstatSync ?? lstatSync); n++) dst = join(trash, `${stem} ${n}${ext}`)
    try {
      (deps.renameSync ?? renameSync)(path, dst)
    } catch (e) {
      // 跨卷（外接盘、另一 APFS 卷）：这个位置没有可用的回收站，与预检口径一致（T28 建议 3）
      if ((e as NodeJS.ErrnoException)?.code === 'EXDEV') throw new TrashError('NO_RECYCLE_BIN', 'no recycle bin at this location')
      throw new TrashError('TRASH_FAILED', 'recycle failed')
    }
  } else {
    throw new TrashError('NO_RECYCLE_BIN', 'recycle bin not supported on this platform')
  }
  if (existsSync(path)) throw new TrashError('TRASH_FAILED', 'still there after recycle')
}
