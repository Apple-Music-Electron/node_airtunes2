{
  'targets': [
    {
      'target_name': 'airtunes',
      'sources': [
        'src/codec.cc', 'src/bindings.cc',
        'src/aes_utils.c', 'src/base64.c',
      ],        
      "include_dirs" : [
        "<!(node -e \"require('nan')\")",
        'C:\\Program Files\\OpenSSL-Win64\\include\\',
      ],
      'conditions': [
        ['OS=="mac"', {
          'include_dirs+': '/System/Library/Frameworks/Kernel.framework/Versions/A/Headers/sys',
          'sources': ['src/coreaudio.cc','src/CAHostTimeBase.cpp', 'alac_unix/EndianPortable.c', 'alac_unix/ALACBitUtilities.c', 'alac_unix/ALACEncoder.cpp',
            'alac_unix/ag_enc.c', 'alac_unix/ag_dec.c', 'alac_unix/dp_enc.c', 'alac_unix/matrix_enc.c',]
        }],
        ['OS=="linux"', {
          'sources': [
            'alac_unix/EndianPortable.c', 'alac_unix/ALACBitUtilities.c', 'alac_unix/ALACEncoder.cpp',
            'alac_unix/ag_enc.c', 'alac_unix/ag_dec.c', 'alac_unix/dp_enc.c', 'alac_unix/matrix_enc.c',
          ],
        }],
        ['OS=="win"', {
          'sources': [
            'alac/EndianPortable.c', 'alac/ALACBitUtilities.c', 'alac/ALACEncoder.cpp',
            'alac/ag_enc.c', 'alac/ag_dec.c', 'alac/dp_enc.c', 'alac/matrix_enc.c',
          ],
        }],
      ]
    }
  ]
}
