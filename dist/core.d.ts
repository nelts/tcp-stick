/// <reference types="node" />
import { EventEmitter } from 'events';
declare type dataHeadLenType = 2 | 4;
export declare type intType = 16 | 32;
declare type readIntMethodType = 'readInt16BE' | 'readInt32BE';
declare type writeIntMethodType = 'writeInt16BE' | 'writeInt32BE';
export default class TcpStick extends EventEmitter {
    private _dataWritePosition;
    private _dataReadPosition;
    private _dataHeadLen;
    private _dataLen;
    private _bufferLength;
    private _buffer;
    private _readIntMethod;
    private _writeIntMethod;
    constructor(bufferLength: number);
    readonly dataHeadLen: dataHeadLenType;
    readonly readIntMethod: readIntMethodType;
    readonly writeIntMethod: writeIntMethodType;
    setReadIntBE(type: intType): this;
    setReadIntLE(type: intType): this;
    getAvailableLen(): number;
    putData(data: Buffer): void;
    putMsg(msg: string): void;
    publish(msg: string | ArrayBuffer): Buffer;
    private getDataLen;
    private getData;
}
export {};
