"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function arrayDeepEquals(left, right) {
    if (left.length !== right.length) {
        return false;
    }
    for (var _i = 0, left_1 = left; _i < left_1.length; _i++) {
        var lItem = left_1[_i];
        if (right.indexOf(lItem) < 0) {
            return false;
        }
    }
    for (var _a = 0, right_1 = right; _a < right_1.length; _a++) {
        var rItem = right_1[_a];
        if (left.indexOf(rItem) < 0) {
            return false;
        }
    }
    return true;
}
exports.arrayDeepEquals = arrayDeepEquals;
