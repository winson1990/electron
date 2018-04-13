#include "weak_reference.h"

static void SetPrototypeMethod(v8::Isolate* isolate,
                               v8::Local<v8::FunctionTemplate> recv,
                               const char* name,
                               v8::FunctionCallback callback)
{
  v8::HandleScope scope(isolate);

  auto tpl = v8::FunctionTemplate::New(isolate, callback);
  auto name_str = v8::String::NewFromUtf8(isolate, name);

  tpl->SetClassName(name_str);
  recv->PrototypeTemplate()->Set(name_str, tpl);
}

static void ThrowException(v8::Isolate* isolate, const char* message)
{
  isolate->ThrowException(v8::Exception::Error(v8::String::NewFromUtf8(isolate, message)));
}

// static
v8::Local<v8::Function> WeakReference::Init(v8::Isolate* isolate)
{
  v8::EscapableHandleScope scope(isolate);

  auto tpl = v8::FunctionTemplate::New(isolate, Constructor);

  tpl->SetClassName(v8::String::NewFromUtf8(isolate, "WeakReference"));
  tpl->InstanceTemplate()->SetInternalFieldCount(1);

  SetPrototypeMethod(isolate, tpl, "getTarget", GetTarget);
  SetPrototypeMethod(isolate, tpl, "isDead", IsDead);

  return scope.Escape(tpl->GetFunction());
}

WeakReference::WeakReference(v8::Local<v8::Object> target)
{
  m_target.Reset(target->GetIsolate(), target);
  m_target.SetWeak();
}

// static
void WeakReference::Constructor(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  auto isolate = args.GetIsolate();;
  v8::HandleScope scope(isolate);

  if (!args.IsConstructCall()) {
    return ThrowException(isolate, "Function must be called as a constructor");
  }

  if (!args[0]->IsObject()) {
    return ThrowException(isolate, "Target must be an object");
  }

  auto target = v8::Local<v8::Object>::Cast(args[0]);
  auto obj = new WeakReference(target);

  obj->Wrap(args.This());
}

// static
void WeakReference::GetTarget(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  auto isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);

  auto self = ObjectWrap::Unwrap<WeakReference>(args.Holder());
  auto target = self->m_target.Get(isolate);

  args.GetReturnValue().Set(target);
}

// static
void WeakReference::IsDead(const v8::FunctionCallbackInfo<v8::Value>& args)
{
  auto isolate = args.GetIsolate();
  v8::HandleScope scope(isolate);

  auto self = ObjectWrap::Unwrap<WeakReference>(args.Holder());
  auto isEmpty = self->m_target.IsEmpty();

  args.GetReturnValue().Set(isEmpty);
}
