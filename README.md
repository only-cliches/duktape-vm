# Duktape Javascript Virtual Machine

[![NPM](https://nodei.co/npm/duktape-vm.png?downloads=true&stars=true)](https://nodei.co/npm/duktape-vm/)

This project is a thin wrapper around the [Duktape Embedded Javascript Engine](https://duktape.org/) compiled to webassembly/asmjs.

- Airtight sandbox for unsafe js code.
- Kills unresponsive scripts after 10 seconds (Prevents `while(true) {}` lock up).
- Restricted code (impossible to access node.js or window methods and objects).
- Runs in modern web browsers using Webassembly with asmjs fallback.
- Runs on anything that supports NodeJS 8 or greater (zero native code/compilation).
- VM supports ES5 and earlier javascript with async and sync exection.
- Supports bidirectional messaging and asynchronous operations.
- Only 110KB gzipped.

## Quick Example
```js
DuktapeVM().then((vm) => {
    vm.eval("2 + 2") // returns "4";
    vm.eval("var testObj = {foo: 'bar'};");
    vm.eval("testObj.foo") // returns "bar";

    vm.asyncEval(` 
        setTimeout(function() {
            _success("hello, " + args[0]);
        }, 1000);`, 
        ["world!"]
    ).then((res) => {
        console.log(res) // hello, world!
    })

    // destroy vm
    vm.destroy();
});
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

The library will attach `DuktapeVM` to window/global, allowing you to access it anywhere in your code.

```html
<!-- Webassembly Only Version (Fast with 75% browser support), 110KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.1.2/build/duktape-vm.min.js"></script>

<!-- AsmJS Only Version (Slower with 95% browser support), 115KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.1.2/build/duktape-vm.min.asm.js"></script>

<!-- Webassembly with AsmJS fallback (Fast with 95% browser support), 220KB -->
<script src="https://cdn.jsdelivr.net/npm/duktape-vm@0.1.2/build/duktape-vm.min.both.js"></script>
```

## Virtual Machine Available Globals
The vm doesn't expose any platform specific methods like `window`, `document`, `global`, `fetch` or anything like that.  Only a subset of APIs are available: `setInterval`, `setTimeout`, `clearTimeout`, `clearInterval`, `Date`, `Array`, `String`, `Number`, `Object`, `RegExp`, `JSON`, `parseInt`, `isNaN` and `Promise`.

Additional methods and variables can be provided by passing them into the DuktapeVM constructor.

## Setup & Usage
```ts
DuktapeVM(`
    // Provide data and methods to VM instance
    // vm_breakout() allows you to eval code in the parent window/global space.
    // vm_breakout is only available here, it's not available in subsequent "vm.eval" or "vm.evalAsync" calls.

    // all methods should be attached to the exports object
    exports.console = function(message) {
        // print to parent console
        vm_breakout("console.log('" + message + "');")
    };
    
    // you can also inline js libraries here
    // global scope is available on the variable "self"
`).then((vm) => {
    // vm contains the javascript vm reference

    // Standard eval
    let value = vm.eval("2 + 2"); // value contains "4";

    // Eval with arguments
    // arguments are passed as array called "args"
    // when you use arguments you muse use "return" if you want to get the value back.
    vm.eval(`return args[0] + args[1]`, [2, 3]); // returns 5

    // Messaging API
    vm.eval(`
        exports.onMessage(function(msg) {
            // got message from parent!
        })
        
        // send message to parent
        exports.message("some message to parent");
    `);

    // Send message to vm
    vm.message("this is a message to the vm");

    // Listen for messages from vm
    vm.onMessage((msg) => {
        console.log("Got message from vm: " + msg);
    });

    // Async eval
    // use _success and _error as callbacks 
    vm.asyncEval(`
        setTimeout(function() {

            _success("done!");
            // _error("something went wrong!");

        }, 1000);
    `).then((result) => {
        console.log(result) // "done"
    });

    // Async Eval with arguments
    // arguments are passed in as "args" array
    vm.asyncEval(`
        setTimeout(function() {

            _success(args[0]);
            // _error("something went wrong!");
        }, 1000);
    `, ["hello world!"]).then((result) => {
        console.log(result) // "hello world!"
    });

    // destroy vm
    vm.destroy();
})

```


# MIT License

Copyright (c) 2018 Scott Lott

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