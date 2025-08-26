/* Copyright (c) 2023-present, Дід Alik and the Kids {{{1
 *
 * This script is licensed under the Apache License, Version 2.0, found in the
 * LICENSE file in the root directory of this source tree.
 * * */

import { Semaphore, } from './util.mjs' // {{{1

/* The Model-View-Test with Channels framework: {{{1

 +---------+             +---------+      o
 |  model  |             |  view   |     -+-
 |         |             |         |<---  $
 | send ---+--- receive  |         |     / \
 | ---> channel -------->|         |             +---------+     
 |      ---+---          |         |             |  test   |
 |         |             |         |  receive ---+--- send |
 |         |  receive ---+--- send |<-------- channel <--- |
 |         |<-------- channel <--- |          ---+---      |
 +---------+          ---+---      |             |         |
                         |         |             +---------+
                         +---------+                      
*/

class Channel { // {{{1
  constructor (vm, receiveImpl, sendImpl = null, queue = []) { // {{{2
    Object.assign(this, { vm, receiveImpl, sendImpl, queue })
  }

  receive () { // {{{2
    this.receiveImpl.call(this.vm, this.queue)
  }

  send (item, impl = null) { // {{{2
    if (impl) {
      impl(item, this.queue)
    } else if (this.sendImpl) {
      this.sendImpl.call(this.vm, item, this.queue)
    } else {
      this.queue.push(item)
    }
    return this;
  }
  // }}}2
}

class Model { // {{{1
  constructor (vm) { // {{{2
    this.vm = vm
    this.channel = new Channel(vm, vm.c.kit.decodeX)
  }

  done () { // {{{2
    return new Promise((resolve, reject) => vm.c.kit.doneModel.call(this.vm, 
      resolve, reject
    ));
  }

  run () { // {{{2
    console.log('Model.run this', this)
    return new Promise((resolve, reject) => this.vm.c.kit.runModel.call(this.vm, 
      resolve, reject
    ));
  }

  static init (vm, config) { // {{{2
    return new Promise((resolve, reject) => vm.c.kit.initModel.call(vm, 
      config, resolve, reject
    ));
  }
  // }}}2
}

class Test { // {{{1
  constructor (vm) { // {{{2
    this.vm = vm
    this.lock = new Semaphore(1)
    this.channel = new Channel(vm, vm.c.kit.receiveJobs, vm.c.kit.sendItems)
  }

  done () { // {{{2
    return new Promise((resolve, reject) => vm.c.kit.doneTest.call(this.vm, 
      resolve, reject
    ));
  }

  run () { // {{{2
    return new Promise((resolve, reject) => this.vm.c.kit.runTest.call(this.vm, 
      resolve, reject
    ));
  }

  static init (vm, config) { // {{{2
    return new Promise((resolve, reject) => vm.c.kit.initTest.call(vm,
      config, resolve, reject
    ));
  }

  static isJob (item) { // {{{2
    return item.length > 0 && typeof item[0] == 'function';
  }
  // }}}2
}

class View { // {{{1
  constructor (vm) { // {{{2
    this.vm = vm
    this.channel = new Channel(vm, vm.c.kit.encodeX)
  }

  done () { // {{{2
    return new Promise((resolve, reject) => vm.c.kit.doneView.call(this.vm, 
      resolve, reject
    ));
  }

  run () { // {{{2
    return new Promise((resolve, reject) => this.vm.c.kit.runView.call(this.vm, 
      resolve, reject
    ));
  }

  static init (vm, config) { // {{{2
    vm.c.view = new View(vm)
    return new Promise((resolve, reject) => vm.c.kit.initView.call(vm, 
      config, resolve, reject
    ));
  }
  // }}}2
}

export { // {{{1 
  Channel, Model, Test, View, 
}
