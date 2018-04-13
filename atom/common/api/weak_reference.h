#pragma once

#include <v8.h>
#include <node_object_wrap.h>

class WeakReference : public node::ObjectWrap {
 public:
  static v8::Local<v8::Function> Init(v8::Isolate* isolate);

 private:
  explicit WeakReference(v8::Local<v8::Object> target);

  static void Constructor(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void GetTarget(const v8::FunctionCallbackInfo<v8::Value>& args);
  static void IsDead(const v8::FunctionCallbackInfo<v8::Value>& args);

  v8::Persistent<v8::Object> m_target;
};
