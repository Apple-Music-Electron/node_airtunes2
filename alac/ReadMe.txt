This package contains ALAC code used in foobar2000 / foobar2000 Mobile; derived from Apple's public ALAC code release.
Various issues from the original ALAC code have been fixed; performance has been improved (credits go to original code author for the hint about bitscan intrinsics).
This code has been tested on every major platform out there: Windows, Linux, Android, OSX.
Bug reports are welcome.

Home page:
http://perkele.cc/software/ALAC

Change log:

* 2015-04-07 release
 * Malformed file handling improvements.
 * Fixed non-compilation on non-MSVC.
 * Added GCC/LLVM intrinsics for bitscan, for greatly improved decoding speed.
 * Better byte order detection, errors out instead of defaulting to big endian when it cannot determine byte order.
* 2011-12-10 release
 * MSVC/Windows compatibility fixes (MSVC does not like "static inline").
 * MSVC specific optimizations (intrinsics).
 * Various buffer overrun bugs fixed.
 * Made "max output bytes" in the encoder publicly accessible so the frontend can safely allocate buffers.

 
- PP / p@perkele.cc