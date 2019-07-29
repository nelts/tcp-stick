"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
class Messager extends core_1.default {
    constructor(options) {
        options = Object.assign({
            bufferSize: 1024,
            type: 16,
            bigEndian: true,
        }, options);
        super(options.bufferSize);
        if (options.bigEndian) {
            this.setReadIntBE(options.type);
        }
        else {
            this.setReadIntLE(options.type);
        }
        this.on('buffer', (data) => {
            const headLen = this.dataHeadLen;
            const head = Buffer.alloc(headLen);
            data.copy(head, 0, 0, headLen);
            const dataLen = head[this.readIntMethod](0);
            const body = Buffer.alloc(dataLen);
            data.copy(body, 0, headLen, headLen + dataLen);
            this.emit('data', body);
        });
    }
}
exports.default = Messager;
