// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE.chromium file.

#ifndef ATOM_COMMON_API_WATCHDOG_H_
#define ATOM_COMMON_API_WATCHDOG_H_

#include <atomic>
#include <condition_variable>
#include <chrono>
#include <mutex>
#include <thread>

#include "base/macros.h"
#include "base/memory/weak_ptr.h"
#include "base/single_thread_task_runner.h"

namespace atom {

class Watchdog {
 public:
  Watchdog(unsigned int timeout);
  ~Watchdog();

 private:
  void Crash();
  void SetDone();
  void SetResponsive();
  bool WaitForTimeout();
  void ThreadProc();

  std::chrono::milliseconds timeout_;
  std::thread thread_;
  std::mutex mutex_;
  std::atomic_flag unresponsive_ = ATOMIC_FLAG_INIT;
  std::condition_variable done_changed_;
  volatile bool done_ = false;

  scoped_refptr<base::SingleThreadTaskRunner> task_runner_;
  base::WeakPtrFactory<Watchdog> weak_factory_;

  DISALLOW_COPY_AND_ASSIGN(Watchdog);
};

}  // namespace atom

#endif  // ATOM_COMMON_API_WATCHDOG_H_
