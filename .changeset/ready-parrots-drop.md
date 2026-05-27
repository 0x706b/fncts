---
"@fncts/base": patch
---

- Fixed Conc.drop(n) for negative values so drop(n <= 0) returns the original Conc instead of producing an invalid slice.
- Fixed Conc.zipWithIndexOffset(offset) to continue indexing across all elements instead of stopping early.
- Fixed Conc.append when appending a non-byte value to a buffered binary Conc, preserving the appended value and correctly transitioning to a non-binary buffer.
