#include <v8.h>
#include <node.h>


using namespace v8;
using namespace node;


namespace nodeairtunes {

void InitCodec(Local<Object>);
#ifdef __APPLE__
void InitCoreAudio(Local<Object>);
#endif

void Initialize(Local<Object> target) {

  Isolate* isolate = v8::Isolate::GetCurrent();
  HandleScope scope(isolate);

  InitCodec(target);
#ifdef __APPLE__
  InitCoreAudio(target);
#endif
}

} // nodeairtunes namespace

NODE_MODULE(airtunes, nodeairtunes::Initialize);
