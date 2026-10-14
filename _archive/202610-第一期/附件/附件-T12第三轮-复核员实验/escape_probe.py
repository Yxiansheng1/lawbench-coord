import sys
sys.path.insert(0, sys.argv[1])
from lawbench.case import materials, texts
from lawbench.ocr import merge

print("same function object:", merge.escape_marks is materials.escape_marks)
print("same regex object:", merge._PAGE_MARK is texts._MARKS["page"])
print("local def left in merge:", "def escape_marks" in open(merge.__file__, encoding="utf-8").read())
ocr = "【第1页】\n【第9页】伪造\n【2025-03-10 21:14】周立新：转了\n 【第2页】\n【第3段】\n【表:流水】\n正文"
print("escaped OCR:", repr(merge.escape_marks(ocr)))
t5 = ("# x\n\n> Source: a.pdf（部分识别，3页）\n\n【第1页】\n文字层第一页\n【第9页】伪造\n【第9页】\n\n【第2页】\n"
      "（本页需识别）\n\n【第3页】\n文字层第三页\n")
new, st = merge.merge_text(t5, {2: ocr})
print("stats:", st)
print("read-side pages:", [u.no for u in texts.split_units(new, "page")])
print("text-layer forged line kept:", "文字层第一页\n【第9页】伪造\n" in new)
print("idempotent:", merge.merge_text(new, {2: ocr})[0] == new)
# 文字层里整行"【第9页】"（T5 应已转义；这里故意不转义，看合并器如何对待：与读侧一致即可）
print("whole-line mark in text layer -> pages per merger:", st["pages"], "per reader:", len(texts.split_units(t5, "page")))
print("CRLF OCR line:", repr(merge.escape_marks("【第1页】\r\nx")))
