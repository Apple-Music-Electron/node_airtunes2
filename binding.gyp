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
                    ],
                    'xcode_settings': {
                        'CLANG_CXX_LANGUAGE_STANDARD': 'c++17'
                    }
                }],
                ['OS=="linux"', {
                    'sources': [
                    ],
                    'cflags_cc': [
                      "-std=c++17"
                    ]
                }],
                ['OS=="win"', {
                    'include_dirs': ['C:\\Program Files\\OpenSSL-Win64\\include\\'],
                    "msbuild_settings": {
                          "ClCompile": {
                              "LanguageStandard": "stdcpp17"
                           }
                    },"msvs_settings": {
            "VCCLCompilerTool": {
              "AdditionalOptions": [ "-std:c++17", ],
            },
                    'sources': [
                    ],
                }],
            ]
        }
    ]
}
