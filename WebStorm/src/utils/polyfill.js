if (!Array.prototype.findFirst) {
    Array.prototype.findFirst =function(fun/*, thisArg*/) {
        'use strict';

        if (this == null) {
            throw new TypeError('Array.prototype.findFirst called on null or undefined');
        }

        if (typeof fun !== 'function') {
            throw new TypeError();
        }

        var t = Object(this);
        var len = t.length >>> 0;

        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return t[i];
            }
        }

        return null;
    };
}