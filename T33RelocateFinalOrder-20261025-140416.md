# T33明确前置条件一处修正+既有launcher三literal复制，240秒新预算
精确1017/max。原单completed，root已完整读formal/3文件与全部server diff，原server独立9路线受限准入认可但GUI尚未跑。首工具只读本令，之后只允许原生pwsh绝对路径/login=false，不Bash/parallel；不要Git/搜索/测试/compile/parser/服务/GUI。上下文和实际文件全在本令，禁止泛查旧历史。
白名单D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639/source-stage.py、D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639/README.md、新D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639/start.ps1和stop.ps1、D:\Lawbeach\lawbench-coord\ORCH-B-T33RelocateFinalReturn-20261025-140416.md。server.py与产品/旧准备全部只读；不重写server、不运行任何准备件、不生成根。
root具体拒收：_registered_identity强制material.status=='parsed'与既定“不OCR/不模型”相冲突。已实证JPEG47379B的原生Materials真实状态是needs_ocr，size47379/hashfeeb9faf...59ad；注册R01/path/identity成功不等于OCR完成。
只把该一处状态断言改成严格needs_ocr（不是通配/移除断言/allow失败状态），固定错误文案对应“待识别”；该函数其它内容及全文件其余字节不变。README中两处parsed材料前提同步改为needs_ocr，不改其它安全/运行要求。旧formal不改；新formal纠正该前提。
现函数完整上下文：
```python
def _registered_identity(
    case_dir: pathlib.Path,
    source: pathlib.Path,
) -> dict[str, dict[str, Any]]:
    refs_path = case_dir / REF_REL
    index_path = case_dir / INDEX_REL
    refs = _read_json(refs_path, "引用.json")
    index = _read_json(index_path, "index.json")
    _guard(refs.get("v") == 1, "引用.json 版本不符")
    ref_entries = refs.get("refs")
    _guard(isinstance(ref_entries, list), "引用.json refs 不是数组")
    matches = [
        item
        for item in ref_entries
        if isinstance(item, dict) and item.get("ref_id") == REF_ID
    ]
    _guard(len(matches) == 1, "引用.json 必须恰有一个 R01")
    ref = matches[0]
    _guard(_same_path(ref.get("path"), source), "R01 path 不是当前 relocation-source.jpg")
    _guard(ref.get("kind") == "file", "R01 kind 不是 file")
    _guard(ref.get("status") == "ok", "R01 尚未由真实 API 登记为 ok")

    _guard(index.get("v") == 1, "index.json 版本不符")
    materials = index.get("materials")
    _guard(isinstance(materials, list), "index.json materials 不是数组")
    found = [
        item
        for item in materials
        if isinstance(item, dict)
        and item.get("origin") == "ref"
        and item.get("ref_id") == REF_ID
        and item.get("rel_path") == SOURCE_REL
    ]
    _guard(len(found) == 1, "index.json 必须恰有一份 R01 源材料")
    material = found[0]
    _guard(isinstance(material.get("material_id"), str) and MATERIAL_ID.fullmatch(material["material_id"]) is not None, "R01 material_id 不符")
    _guard(material.get("status") == "parsed", "R01 材料尚未由真实 API 解析成功")
    _guard(material.get("sha256") == JPEG_HASH, "R01 材料 SHA-256 不符")
    _guard(material.get("size") == JPEG_BYTES, "R01 材料字节数不符")
    return {
        "refs": _file_record(refs_path),
        "index": _file_record(index_path),
        "ref": ref,
        "material": material,
    }


```

新launcher两文件源D:\Lawbeach\lawbench-coord\T33RelocateFinalInput-20261025-140416/start.ps1和D:\Lawbeach\lawbench-coord\T33RelocateFinalInput-20261025-140416/stop.ps1（root原样复制已审A本轮592a7...start/09adee...stop）。只把源start的NativeEntry绝对路径中的HostEntry-20261025-094816/server.py改成D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639/server.py（文件原形式反斜杠）、NativeEntrySha256由93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139改为2247027d653b3f0180b276cebacff0f7e0a491d64e9a9aac54deb88dce6447b2。只把stop的runsRoot literal HostEntry-20261025-094816/runs改成D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639/runs。除此之外整文件每字节保持，不新loader/动态hash/改旧E50/guard/resolver/PDF/环境/关闭/预算/C551/原overlay前缀和disable+insert suffix。
可一次exec准确读取并仅复制这两个文件+literal替换；helper/README用patch或准确替换。不需要作者额外static审计/工具调用；root负责全累计审查/AST/运行。只给具体改动/未运行的正式D:\Lawbeach\lawbench-coord\ORCH-B-T33RelocateFinalReturn-20261025-140416.md后停止。
