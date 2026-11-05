// 右栏"材料""成果"的两个按钮（令 2043 第 2 条，律师第一批反馈）：打开所在文件夹、移除此材料。
// 都经 Host（界面不能动本机文件）；移除 = Host 删文件 + 现有的重新扫描，服务据此把它从材料表和索引里去掉（N61）。
import { DEFAULT_TARGET } from './cases.ts'
import { errorText, type Material } from './format.ts'
import { call, confirm, notice, type CaseRef } from './state.ts'

/** 成果文件夹（服务的 OUTPUT_DIR，在案件根下）。 */
export const OUTPUT_DIR = '成果'

/**
 * 在资源管理器里打开案件下的文件夹。材料区开默认导入位置（还没建出来时开案件根）；成果区开"成果"。
 * @returns 打开了为 true。
 */
export async function openCaseFolder(c: CaseRef, which: 'materials' | 'outputs'): Promise<boolean> {
  const rel = which === 'materials' ? DEFAULT_TARGET : OUTPUT_DIR
  let r = await call<{ opened: true }>('openFolder', { case_id: c.case_id, root: c.root, rel })
  if (!r.ok && r.error.code === 'NOT_FOUND' && which === 'materials') r = await call<{ opened: true }>('openFolder', { case_id: c.case_id, root: c.root, rel: '' })
  if (!r.ok) { notice('文件夹没能打开', errorText(r.error)); return false }
  return true
}

/**
 * 用默认程序打开案件里的一个成果文件（令 1321 C.2 成果卡片"打开"）。经 Host，限案件根内的文书类文件。
 * @param rel - 案件根下的相对路径（服务给的成果路径，如"成果/借款合同-v1.docx"）。
 * @returns 打开了为 true。
 */
export async function openCaseFile(c: CaseRef, rel: string): Promise<boolean> {
  const r = await call<{ opened: true }>('openFile', { case_id: c.case_id, root: c.root, rel })
  if (!r.ok) { notice('文件没能打开', errorText(r.error)); return false }
  return true
}

export const REMOVE_TITLE = '移除这份材料？'
type RemovableMaterial = Pick<Material, 'name' | 'rel_path'> & Partial<Pick<Material, 'origin'>>
export const removeText = (m: RemovableMaterial): string =>
  m.origin === 'ref'
    ? `"${m.name}"只会从案件里移除引用，同时清掉本案的派生文本和检索记录；外部原件不动，不会移动、改名或删除。已有的成果和 wiki 里引用到它的地方需要复核。`
    : `"${m.rel_path}"会移到回收站，可从回收站找回；同时从材料列表和检索里去掉。已有的成果和 wiki 里引用到它的地方需要复核。`
export const WIKI_UPDATE_HINT = '案件 wiki 生成时用过这份材料，请到材料页更新 wiki。'

/** 契约 1.4 `POST /api/materials/remove` 的返回。 */
export interface RemoveResult { removed: string[]; already_removed: string[]; failed: Array<{ material_id: string; reason: string }>; wiki_needs_update: boolean }

/** 契约 1.5 `POST /api/materials/relocate` 的返回。 */
export interface RelocateResult {
  ref_id: string
  restored: number
  still_missing: number
  scan: { added: number; changed: number; removed: number; failed: number; review_needed: boolean }
}

/**
 * 移除一份材料（契约 1.4/1.5）：复制材料移到回收站，引用材料只取消登记；两种都先确认。
 * 移走了、此前已经移除过的都算成功（让列表刷新）；没移走的把服务给的原因原样告诉律师。
 * @returns 列表需要刷新为 true（取消或失败为 false）。
 */
export async function removeMaterial(c: CaseRef, m: Pick<Material, 'material_id' | 'name' | 'rel_path'> & Partial<Pick<Material, 'origin'>>): Promise<boolean> {
  const isRef = m.origin === 'ref'
  if (!await confirm(REMOVE_TITLE, removeText(m), isRef ? '移除引用' : '移到回收站')) return false
  const r = await call<RemoveResult>('materialsRemove', { case_id: c.case_id, material_ids: [m.material_id] })
  if (!r.ok) { notice('材料没能移除', errorText(r.error)); return false }
  const failed = r.value.failed.find((f) => f.material_id === m.material_id) ?? r.value.failed[0]
  if (failed) { notice('材料没能移除', `"${m.name}"：${failed.reason}`); return false }
  const wiki = r.value.wiki_needs_update ? WIKI_UPDATE_HINT : ''
  if (r.value.already_removed.includes(m.material_id)) {
    notice('这份材料此前已经移除', `"${m.name}"已经不在案件里，列表已更新。${isRef ? '外部原件没有改动。' : ''}${wiki}`)
  } else if (isRef) {
    notice('已移除引用', `"${m.name}"已从案件里移除引用，外部原件没有改动。${wiki}`)
  } else {
    notice('已移到回收站', `"${m.name}"已从案件里移除，需要时可从回收站找回。${wiki}`)
  }
  window.dispatchEvent(new CustomEvent('lawbench:materials-changed', { detail: c.case_id }))
  return true
}

/**
 * 把缺失的引用根指向律师选出的新位置。服务只按唯一身份认回材料；多候选或仍找不到的继续 missing。
 * 请求失败不显示成功、不刷新本地列表，避免把服务未保存的假状态当成功。
 */
export async function relocateMaterial(
  c: CaseRef,
  m: Pick<Material, 'ref_id'>,
  path: string,
): Promise<boolean> {
  if (!m.ref_id) { notice('重新定位没有完成', '这份材料没有引用根编号，请联系技术支持。'); return false }
  const r = await call<RelocateResult>('materialsRelocate', { case_id: c.case_id, ref_id: m.ref_id, path })
  if (!r.ok) { notice('重新定位没有完成', errorText(r.error)); return false }
  const tail = r.value.still_missing > 0 ? '；请检查这些材料的原位置。' : '。'
  notice('引用已重新定位', `恢复了 ${r.value.restored} 份，仍有 ${r.value.still_missing} 份找不到${tail}`)
  window.dispatchEvent(new CustomEvent('lawbench:materials-changed', { detail: c.case_id }))
  return true
}
