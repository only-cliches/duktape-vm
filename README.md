#Duktape Javascript Virtual Machine

[![NPM](https://nodei.co/npm/duktape-vm.png?downloads=true&stars=true)](https://nodei.co/npm/duktape-vm/)

This project is a thin wrapper around the [DukTape Embedded Javascript Engine](https://duktape.org/) compiled to webassembly/asmjs.

- Airtight sandbox for unsafe js code.
- Runs in modern web browsers using Webassembly with asmjs fallback.
- Runs on anything that supports NodeJS (no native code/compilation!).
- Restricted code (cannot access node.js or window methods).
- VM supports ES5 and earlier javascript.
- Only 140KB gzipped.

##2 minute example
```js

const obj = {
    key: "value";
}

DuktapeVM(`
    // Provide variables and data to VM instance
    // vm_breakout() allows you to run code in the parent window/global space.
    // vm_breakout is only available here, it's not available in subsequent "vm.eval" calls.

    exports.console = function(message) {
        // print to parent console
        vm_breakout("console.log(" + message + ");")
    };

    exports.someObj = ${JSON.stringify(obj)};

`).then((vm) => {

    // instance is ready
    vm.eval("2 + 2") // returns "4";
    vm.eval("exports.console('hello, world!')") // prints "hello, world!" to the browser console
    vm.eval("exports.someObj.key") // returns "value";

    // destroy instance
    vm.destroy();
})
```

## Installation

```sh
npm i duktape-vm --save
```

Using in Typescript/Babel project:

```js
import { DuktapeVM } from "duktape-vm";
```

Using in Node:

```js
const DuktapeVM = require("duktape-vm").DuktapeVM;
```

To use directly in the browser, drop ONE of the tags below into your `<head>`.

```html
<!-- Webassembly Only Version (Fast with 75% browser support), 140KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.0.1/build/duktape-vm.min.js"></script>

<!-- AsmJS Only Version (Slower with 95% browser support), 150KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.0.1/build/duktape-vm.min.asm.js"></script>

<!-- Webassembly AND AsmJS Version (Fast with 95% browser support), 280KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.0.1/build/duktape-vm.min.both.js"></script>
```

# MIT License

Copyright (c) 2017 Scott Lott

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.