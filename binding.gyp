{
  'targets': [
    {
      'target_name': 'airtunes',
      'sources': [
        'src/codec.cc', 'src/bindings.cc',
        'alac/EndianPortable.c', 'alac/ALACBitUtilities.c', 'alac/ALACEncoder.cpp',
        'alac/ag_enc.c', 'alac/ag_dec.c', 'alac/dp_enc.c', 'alac/matrix_enc.c',
        'src/aes_utils.c', 'src/base64.c'
      ],
      "include_dirs" : [
        "<!(node -e \"require('nan')\")"
      ],
      "include_dirs!" : [
        "C:\\Program Files (x86)\\Windows Kits\\10\\Include\\10.0.19041.0\\um\\"
      ],
      'conditions': [
        ['OS=="mac"', {
          'include_dirs+': '/System/Library/Frameworks/Kernel.framework/Versions/A/Headers/sys',
          'sources': ['src/coreaudio.cc','src/CAHostTimeBase.cpp']
        }]
      ]
    }
  ]
}
