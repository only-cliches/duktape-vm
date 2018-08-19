const DuktapeVM = require("./duktape-vm").DuktapeVM;

DuktapeVM().then((vm) => {
    console.log(vm.eval("Object.keys(Duktape)"));
})