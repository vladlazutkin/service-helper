"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const throttle = function (ms) {
    let isThrottled = false;
    return (func) => {
        if (isThrottled) {
            return;
        }
        func();
        isThrottled = true;
        setTimeout(() => {
            isThrottled = false;
        }, ms);
    };
};
exports.default = throttle;
//# sourceMappingURL=trottle.js.map