"use strict";
// tslint:disable-next-line:no-reference
/// <reference path="./@types/index.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var CustomGQLType = /** @class */ (function () {
    function CustomGQLType(type, input) {
        this.graphType = type;
        this.graphInput = input ? input : type;
    }
    return CustomGQLType;
}());
exports.CustomGQLType = CustomGQLType;
//# sourceMappingURL=types.js.map