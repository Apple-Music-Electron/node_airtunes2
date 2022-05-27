{
  'targets': [
    {
      'target_name': 'airtunes',
      'sources': [
        'src/codec.cc', 'src/bindings.cc',
        'src/aes_utils.c', 'src/base64.c',
      ],
      'conditions': [
        ['OS=="mac"', {
          'include_dirs': 
            ['/System/Library/Frameworks/Kernel.framework/Versions/A/Headers/sys'
            ],

          'sources': [
            ]
        }],
        ['OS=="linux"', {         
          'sources': [
          ],
        }],
        ['OS=="win"', {
          'include_dirs':[ 'C:\\Program Files\\OpenSSL-Win64\\include\\'],
          'sources': [
          ],
        }],
      ]
    }
  ]
}
