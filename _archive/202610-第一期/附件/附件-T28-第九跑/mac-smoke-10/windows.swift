import CoreGraphics
let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] ?? []
let mine = list.filter { ($0[kCGWindowOwnerName as String] as? String) == CommandLine.arguments[1] && (($0[kCGWindowLayer as String] as? Int) ?? 1) == 0 }
print(mine.count)
