#include <v8.h>
#include <node.h>
#include "nan.h"

using namespace v8;
using namespace node;


namespace nodeairtunes {

void InitCodec(Global<Object>);
#ifdef __APPLE__
void InitCoreAudio(Global<Object>);
#endif

void Initialize(Global<Object> target) {

  Isolate* isolate = v8::Isolate::GetCurrent();
  Nan::HandleScope scope(isolate);

  InitCodec(target);
#ifdef __APPLE__
  InitCoreAudio(target);
#endif
}

} // nodeairtunes namespace

NODE_MODULE(airtunes, nodeairtunes::Initialize);
