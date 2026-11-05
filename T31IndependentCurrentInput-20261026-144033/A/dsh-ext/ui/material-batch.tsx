// T31：输入区显示本次导入形成的材料批次；律师可取消整批或逐份改选。
import { Button, C, S } from './kit.tsx'
import {
  cancelMaterialBatch,
  materialBatchBlockText,
  selectAllMaterialBatchItems,
  toggleMaterialBatchItem,
} from './material-batch.ts'
import { app } from './state.ts'
import { useStore } from './store.ts'

export function MaterialBatchBar({ sessionId, caseId }: { sessionId: string; caseId: string }) {
  const batch = useStore(app, (state) => state.materialBatches[sessionId])
  const block = useStore(app, (state) => state.materialBatchBlocks[sessionId])
  if (block?.case_id === caseId) {
    return (
      <section data-material-batch-block={block.case_id} aria-label="本批材料未就绪"
        style={{ border: `1px solid ${C.warn}`, borderRadius: C.rMd, padding: '7px 10px', background: 'rgba(217,119,6,0.06)' }}>
        <div style={{ ...S.between, gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: C.text }}>{materialBatchBlockText(block.reason)}</span>
          <Button size="sm" variant="ghost" onClick={() => cancelMaterialBatch(sessionId)}>取消本批</Button>
        </div>
      </section>
    )
  }
  if (!batch || batch.case_id !== caseId) return null
  const selected = new Set(batch.selected_ids)
  const pending = batch.items.filter((item) => item.pages_need_ocr.length > 0 || item.status === 'needs_ocr').length
  const failed = batch.items.filter((item) => item.status === 'failed').length
  const allSelected = selected.size === batch.items.length
  return (
    <section data-material-batch={batch.batch_id} aria-label="本批材料范围"
      style={{ border: `1px solid ${C.brand}`, borderRadius: C.rMd, padding: '7px 10px', background: 'rgba(47,107,255,0.04)' }}>
      <div style={{ ...S.between, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ color: C.text }}>
          本批材料：已选 <strong>{selected.size}</strong> / {batch.items.length} 份；下一条消息默认按所选材料处理
        </span>
        <span style={S.row}>
          {!allSelected ? <Button size="sm" variant="ghost" onClick={() => selectAllMaterialBatchItems(sessionId)}>全选</Button> : null}
          <Button size="sm" variant="ghost" onClick={() => cancelMaterialBatch(sessionId)}>取消本批</Button>
        </span>
      </div>
      {pending || failed ? (
        <div style={{ fontSize: 12, color: C.warn, marginTop: 2 }}>
          {pending ? `${pending} 份有页面还需要识别` : ''}{pending && failed ? '；' : ''}{failed ? `${failed} 份处理失败` : ''}。可取消不想让本次提问使用的材料。
        </div>
      ) : null}
      <details style={{ marginTop: 4 }}>
        <summary style={{ cursor: 'pointer', fontSize: 12, color: C.sub }}>取消或改选材料</summary>
        <ul style={{ ...S.list, maxHeight: 180, overflow: 'auto', marginTop: 4 }}>
          {batch.items.map((item) => (
            <li key={item.material_id} style={{ ...S.row, justifyContent: 'flex-start' }}>
              <label style={{ ...S.row, cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(item.material_id)}
                  onChange={() => toggleMaterialBatchItem(sessionId, item.material_id)} />
                <span>{item.name}</span>
              </label>
              {item.pages_need_ocr.length ? <span style={{ ...S.sub, marginLeft: 'auto' }}>待识别</span> : null}
              {item.status === 'failed' ? <span style={{ color: C.err, marginLeft: 'auto' }}>处理失败</span> : null}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
