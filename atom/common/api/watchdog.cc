// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE.chromium file.

#include "atom/common/api/watchdog.h"

#include "atom/common/api/atom_bindings.h"
#include "base/bind.h"
#include "base/threading/thread_task_runner_handle.h"

namespace atom {

Watchdog::Watchdog(unsigned int timeout)
    : timeout_(timeout),
      task_runner_(base::ThreadTaskRunnerHandle::Get()),
      weak_factory_(this) {

  thread_ = std::thread([this] {
    ThreadProc();
  });
}

Watchdog::~Watchdog() {
  SetDone();

  if (thread_.joinable()) {
    thread_.join();
  }
}

void Watchdog::Crash() {
  struct DummyClass { bool crash; };
  static_cast<DummyClass*>(nullptr)->crash = true;
}

void Watchdog::SetDone() {
  std::lock_guard<std::mutex> lock(mutex_);

  done_ = true;
  done_changed_.notify_all();
}

void Watchdog::SetResponsive() {
  unresponsive_.clear();
}

bool Watchdog::WaitForTimeout() {
  std::unique_lock<std::mutex> lock(mutex_);

  return done_changed_.wait_for(lock, timeout_, [this] {
    return done_;
  });
}

void Watchdog::ThreadProc() {
  while (!WaitForTimeout()) {
    if (unresponsive_.test_and_set()) {
      Crash();
    }

    DCHECK(task_runner_);
    task_runner_->PostTask(FROM_HERE, base::Bind(&Watchdog::SetResponsive,
                                                 weak_factory_.GetWeakPtr()));
  }
}

}  // namespace atom
