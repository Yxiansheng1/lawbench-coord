Bug: scanDisplayMarkers silently absorbed malformed marker-shaped physical lines such as `【第08行】` as preceding unit text when the exact marker match failed.
Fix: the consumer now scans each physical line into `line`, preserves the exact marker regex, and fails inventory with `MARKER_FRAME_INVALID` when a non-matching line begins with the reserved `【第` prefix; one mixed valid/malformed fixture control was authored and the existing CRLF negative expectation was updated.
Authored, not run; runtime: 0.
