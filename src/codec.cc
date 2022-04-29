#include <node.h>
#include <node_buffer.h>
#include <v8.h>
#include <cstring>

extern "C" {
#include "aes_utils.h"
}

#include "base64.h"


using namespace v8;
using namespace node;

const int kBlockSize = 16;
static int kFramesPerPacket = 352;

// These values should be changed at each iteration
static uint8_t iv [] = { 0x78, 0xf4, 0x41, 0x2c, 0x8d, 0x17, 0x37, 0x90, 0x2b, 0x15, 0xa6, 0xb3, 0xee, 0x77, 0x0d, 0x67 };
static uint8_t aes_key [] = { 0x14, 0x49, 0x7d, 0xcc, 0x98, 0xe1, 0x37, 0xa8, 0x55, 0xc1, 0x45, 0x5a, 0x6b, 0xc0, 0xc9, 0x79 };

namespace nodeairtunes {


void EncodeALAC(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = Isolate::GetCurrent();
  Local<Context> ctx = isolate->GetCurrentContext();
  EscapableHandleScope scope(isolate);

  if(args.Length() < 4) {
    printf("expected: EncodeALAC(encoder, pcmData, pcmSize, alacData, alacSize)\n");
    args.GetReturnValue().Set(Null(isolate));
  }

  // Local<Object> wrapper;
  // args[0]->ToObject(ctx).ToLocal(&wrapper);
  // ALACEncoder *encoder = (ALACEncoder*)wrapper->GetAlignedPointerFromInternalField(0);

  Local<Value> pcmBuffer = args[1];
  Local<Object> pcmObj;
  pcmBuffer->ToObject(ctx).ToLocal(&pcmObj);
  unsigned char* pcmData = (unsigned char*)Buffer::Data(pcmObj);

  Local<Value> alacBuffer = args[2];
  Local<Object> alacObj;
  alacBuffer->ToObject(ctx).ToLocal(&alacObj);
  unsigned char* alacData = (unsigned char*)Buffer::Data(alacObj);

  int32_t pcmSize = args[3]->Int32Value(ctx).FromJust();

  // AudioFormatDescription inputFormat, outputFormat;
  // FillInputAudioFormat(&inputFormat);
  // FillOutputAudioFormat(&outputFormat);

  int32_t alacSize = pcmSize;

  int bsize = 352;
  int frames = 352;
  int *size  = &alacSize;
	uint8_t *sample = pcmData;
  uint8_t **out = &alacData;

  #ifndef min
  #define min(a,b) (((a) < (b)) ? (a) : (b))
  #endif

  uint8_t *p;
	uint32_t *in = (uint32_t*) sample;
	int count;

	frames = min(frames, bsize);

	// *out = (uint8_t*) malloc(bsize * 4 + 8);
	p = *out;

	*p++ = (1 << 5);
	*p++ = 0;
	*p++ = (1 << 4) | (1 << 1) | ((bsize & 0x80000000) >> 31); // b31
	*p++ = ((bsize & 0x7f800000) << 1) >> 24;	// b30--b23
	*p++ = ((bsize & 0x007f8000) << 1) >> 16;	// b22--b15
	*p++ = ((bsize & 0x00007f80) << 1) >> 8;	// b14--b7
	*p =   ((bsize & 0x0000007f) << 1);       	// b6--b0
	*p++ |= (*in &  0x00008000) >> 15;			// LB1 b7

	count = frames - 1;

	while (count--) {
		// LB1 b6--b0 + LB0 b7
		*p++ = ((*in & 0x00007f80) >> 7);
		// LB0 b6--b0 + RB1 b7
		*p++ = ((*in & 0x0000007f) << 1) | ((*in & 0x80000000) >> 31);
		// RB1 b6--b0 + RB0 b7
		*p++ = ((*in & 0x7f800000) >> 23);
		// RB0 b6--b0 + next LB1 b7
		*p++ = ((*in & 0x007f0000) >> 15) | ((*(in + 1) & 0x00008000) >> 15);

		in++;
	}

	// last sample
	// LB1 b6--b0 + LB0 b7
	*p++ = ((*in & 0x00007f80) >> 7);
	// LB0 b6--b0 + RB1 b7
	*p++ = ((*in & 0x0000007f) << 1) | ((*in & 0x80000000) >> 31);
	// RB1 b6--b0 + RB0 b7
	*p++ = ((*in & 0x7f800000) >> 23);
	// RB0 b6--b0 + next LB1 b7
	*p++ = ((*in & 0x007f0000) >> 15);

	// when readable size is less than bsize, fill 0 at the bottom
	count = (bsize - frames) * 4;
	while (count--)	*p++ = 0;

	// frame footer ??
	*(p-1) |= 1;
	*p = (7 >> 1) << 6;

	*size = p - *out + 1;
  //encoder->Encode(inputFormat, outputFormat, pcmData, alacData, &alacSize);

  args.GetReturnValue().Set(Integer::New(isolate, alacSize));
}

void EncryptAES(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = v8::Isolate::GetCurrent();
  Local<Context> ctx = isolate->GetCurrentContext();
  EscapableHandleScope scope(isolate);

  if(args.Length() < 2) {
    printf("expected: EncryptAES(alacData, alacSize)\n");
    args.GetReturnValue().Set(Null(isolate));
  }

  Local<Value> alacBuffer = args[0];
  Local<Object> alacObj;
  alacBuffer->ToObject(ctx).ToLocal(&alacObj);
  unsigned char* alacData = (unsigned char*)Buffer::Data(alacObj);
  int32_t alacSize = args[1]->Int32Value(isolate->GetCurrentContext()).FromJust();

  // This will encrypt data in-place
  uint8_t *buf;
  int i = 0, j;
  uint8_t nv[kBlockSize];

  aes_context aes_ctx;
  aes_set_key(&aes_ctx, aes_key, 128);
  memcpy(nv, iv, kBlockSize);

  while(i + kBlockSize <= alacSize) {
    buf = alacData + i;

    for(j = 0; j < kBlockSize; j++)
      buf[j] ^= nv[j];

    aes_encrypt(&aes_ctx, buf, buf);
    memcpy(nv, buf, kBlockSize);

    i += kBlockSize;
  }

  args.GetReturnValue().Set(Null(isolate));
}

void InitCodec(Local<Object> target) {
  NODE_SET_METHOD(target, "encodeALAC", EncodeALAC);
  NODE_SET_METHOD(target, "encryptAES", EncryptAES);
}

} // nodeairtunes namespace