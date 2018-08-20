const DuktapeVM = require("./duktape-vm").DuktapeVM;

DuktapeVM(`
    exports.console = function(msg) {
        vm_breakout("console.log(" + msg + ")");
    }
`).then((vm) => {
    console.log(vm.eval("return args[0] + args[1]", [2, 3]));
});