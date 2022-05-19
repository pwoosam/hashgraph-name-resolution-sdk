"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otherPrintFunc = exports.HashgraphNames = void 0;
class HashgraphNames {
    constructor(text) {
        this.text = text;
    }
    printMsg() {
        // eslint-disable-next-line no-console
        console.log(this.text);
    }
}
exports.HashgraphNames = HashgraphNames;
const otherPrintFunc = () => {
    // eslint-disable-next-line no-console
    console.log('ASDF');
};
exports.otherPrintFunc = otherPrintFunc;
