"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
class TcpStick extends events_1.EventEmitter {
    constructor(bufferLength) {
        super();
        this._dataWritePosition = 0;
        this._dataReadPosition = 0;
        this._dataHeadLen = 2;
        this._dataLen = 0;
        this._bufferLength = 512;
        this._readIntMethod = 'readInt16BE';
        this._writeIntMethod = 'writeInt16BE';
        if (bufferLength)
            this._bufferLength = bufferLength;
        this._buffer = Buffer.alloc(this._bufferLength);
    }
    get dataHeadLen() {
        return this._dataHeadLen;
    }
    get readIntMethod() {
        return this._readIntMethod;
    }
    get writeIntMethod() {
        return this._writeIntMethod;
    }
    setReadIntBE(type) {
        this._readIntMethod = 'readInt' + type + 'BE';
        this._writeIntMethod = 'writeInt' + type + 'BE';
        this._dataHeadLen = type === 16 ? 2 : 4;
        return this;
    }
    setReadIntLE(type) {
        this._readIntMethod = 'readInt' + type + 'LE';
        this._writeIntMethod = 'writeInt' + type + 'LE';
        this._dataHeadLen = type === 16 ? 2 : 4;
        return this;
    }
    getAvailableLen() {
        return this._bufferLength - this._dataLen;
    }
    putData(data) {
        if (!data)
            return;
        let dataStart = 0;
        let dataLength = data.length;
        let availableLen = this.getAvailableLen();
        if (availableLen < dataLength) {
            let exLength = Math.ceil((this._dataLen + dataLength) / 512) * 512;
            let tempBuffer = Buffer.alloc(exLength);
            this._bufferLength = exLength;
            if (this._dataWritePosition < this._dataReadPosition) {
                let dataTailLen = this._bufferLength - this._dataReadPosition;
                this._buffer.copy(tempBuffer, 0, this._dataReadPosition, this._dataReadPosition + dataTailLen);
                this._buffer.copy(tempBuffer, dataTailLen, 0, this._dataWritePosition);
            }
            else {
                this._buffer.copy(tempBuffer, 0, this._dataReadPosition, this._dataWritePosition);
            }
            this._buffer = tempBuffer;
            tempBuffer = null;
            this._dataReadPosition = 0;
            this._dataWritePosition = this._dataLen;
            data.copy(this._buffer, this._dataWritePosition, dataStart, dataStart + dataLength);
            this._dataLen += dataLength;
            this._dataWritePosition += dataLength;
        }
        else if (this._dataWritePosition + dataLength > this._bufferLength) {
            let bufferTailLength = this._bufferLength - this._dataWritePosition;
            if (bufferTailLength < 0) {
                throw new Error('buffer尾部剩余空间的长度不能小于0');
            }
            let dataEndPosition = dataStart + bufferTailLength;
            data.copy(this._buffer, this._dataWritePosition, dataStart, dataEndPosition);
            this._dataWritePosition = 0;
            dataStart = dataEndPosition;
            let unDataCopyLen = dataLength - bufferTailLength;
            data.copy(this._buffer, this._dataWritePosition, dataStart, dataStart + unDataCopyLen);
            this._dataLen += dataLength;
            this._dataWritePosition += unDataCopyLen;
        }
        else {
            if (this._dataWritePosition > this._bufferLength)
                throw new Error('something error');
            data.copy(this._buffer, this._dataWritePosition, dataStart, dataStart + dataLength);
            this._dataLen += dataLength;
            this._dataWritePosition += dataLength;
        }
        this.getData();
    }
    putMsg(msg) {
        const bodyBuf = Buffer.from(msg, 'utf8');
        const headBuf = Buffer.alloc(this._dataHeadLen);
        headBuf[this.writeIntMethod](bodyBuf.byteLength, 0);
        this.putData(headBuf);
        this.putData(bodyBuf);
    }
    publish(msg) {
        const bodyBuf = typeof msg === 'string' ? Buffer.from(msg, 'utf8') : Buffer.from(msg);
        const headBuf = Buffer.alloc(this._dataHeadLen);
        headBuf[this.writeIntMethod](bodyBuf.byteLength, 0);
        const msgBuf = Buffer.alloc(headBuf.length + bodyBuf.length);
        headBuf.copy(msgBuf, 0, 0, headBuf.length);
        bodyBuf.copy(msgBuf, headBuf.length, 0, bodyBuf.length);
        return msgBuf;
    }
    getDataLen() {
        let dataLen = 0;
        if (this._dataLen === this._bufferLength && this._dataWritePosition >= this._dataReadPosition) {
            dataLen = this._bufferLength;
        }
        else if (this._dataWritePosition >= this._dataReadPosition) {
            dataLen = this._dataWritePosition - this._dataReadPosition;
        }
        else {
            dataLen = this._bufferLength - this._dataReadPosition + this._dataWritePosition;
        }
        if (dataLen !== this._dataLen) {
            throw new Error('程序有漏洞,dataLen长度不合法');
        }
        return dataLen;
    }
    getData() {
        while (true) {
            if (this.getDataLen() <= this._dataHeadLen)
                break;
            let buffLastCanReadLen = this._bufferLength - this._dataReadPosition;
            let dataLen = 0;
            let headBuffer = Buffer.alloc(this._dataHeadLen);
            if (buffLastCanReadLen < this._dataHeadLen) {
                this._buffer.copy(headBuffer, 0, this._dataReadPosition, this._buffer.length);
                let unReadHeadLen = this._dataHeadLen - buffLastCanReadLen;
                this._buffer.copy(headBuffer, buffLastCanReadLen, 0, unReadHeadLen);
                dataLen = headBuffer[this.readIntMethod](0) + this._dataHeadLen;
            }
            else {
                this._buffer.copy(headBuffer, 0, this._dataReadPosition, this._dataReadPosition + this._dataHeadLen);
                dataLen = headBuffer[this.readIntMethod](0);
                dataLen += this._dataHeadLen;
            }
            if (this.getDataLen() < dataLen)
                break;
            else {
                let readData = Buffer.alloc(dataLen);
                if (this._bufferLength - this._dataReadPosition < dataLen) {
                    let firstPartLen = this._bufferLength - this._dataReadPosition;
                    this._buffer.copy(readData, 0, this._dataReadPosition, firstPartLen + this._dataReadPosition);
                    let secondPartLen = dataLen - firstPartLen;
                    this._buffer.copy(readData, firstPartLen, 0, secondPartLen);
                    this._dataReadPosition = secondPartLen;
                }
                else {
                    this._buffer.copy(readData, 0, this._dataReadPosition, this._dataReadPosition + dataLen);
                    this._dataReadPosition += dataLen;
                }
                try {
                    this.emit('buffer', readData);
                    this._dataLen -= readData.length;
                    if (this._dataReadPosition === this._dataWritePosition)
                        break;
                }
                catch (e) {
                    this.emit('error', e);
                }
            }
        }
    }
}
exports.default = TcpStick;
