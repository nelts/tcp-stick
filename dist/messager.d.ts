import Core, { intType } from './core';
export interface MessagerOptions {
    bufferSize?: number;
    type?: intType;
    bigEndian?: boolean;
}
export default class Messager extends Core {
    constructor(options?: MessagerOptions);
}
