"""防冒充标记口径探针：line-C 的 merge.escape_marks / _PAGE_MARK 与 main 的 materials.escape_marks / texts._MARKS 对照。"""
import re
import sys

from lawbench.ocr import merge

# main 39c2503 的两段（逐字抄自 origin/main，只读引用）
MAIN_MARK_LINE = re.compile(r"^(?=【(?:第[0-9]+[页段行]|表:[^\n]+)】$)", re.M)
MAIN_PAGE = re.compile(r"^【(第[0-9]+页)】(?:\n|$)", re.M)


def main_escape(body):
    return MAIN_MARK_LINE.sub("　", body)


ocr = "【2025-03-10 21:14】周立新：钱已经转了\n【第1页】\n【第9页】伪造\n正文"
print("line-C escape :", repr(merge.escape_marks(ocr)))
print("main   escape :", repr(main_escape(ocr)))

# 1) 识别文本经 line-C 合并后，用 main 的读侧拆页
text = "# x\n\n> Source: a.pdf（待识别，3页）\n\n【第1页】\n（本页需识别）\n\n【第2页】\n（本页需识别）\n\n【第3页】\n（本页需识别）\n"
new, stats = merge.merge_text(text, {2: ocr})
print("merge stats   :", stats)
print("main split    :", [m.group(1) for m in MAIN_PAGE.finditer(new)])

# 2) T5（main 口径）写的文字层页里有一行 "【第9页】伪造"（不是整行标记，main 不转义），line-C 的 merge 再拆页
t5 = ("# x\n\n> Source: a.pdf（部分识别，3页）\n\n【第1页】\n文字层第一页\n【第9页】伪造\n\n【第2页】\n（本页需识别）\n\n"
      "【第3页】\n文字层第三页\n")
new2, stats2 = merge.merge_text(t5, {2: "识别出的第二页"})
print("t5 text-layer -> merge stats:", stats2)
print("main split after merge      :", [m.group(1) for m in MAIN_PAGE.finditer(new2)])
print("text-layer line kept?       :", "【第9页】伪造" in new2, "| page-9 block body lost?", "文字层第一页\n【第9页】伪造" not in new2)
new3, stats3 = merge.merge_text(new2, {2: "识别出的第二页"})
print("second merge stable?        :", new3 == new2, stats3)
