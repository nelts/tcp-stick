import { EventEmitter } from 'events';

type dataHeadLenType = 2 | 4;
export type intType = 16 | 32;
type readIntMethodType = 'readInt16BE' | 'readInt32BE';
type writeIntMethodType = 'writeInt16BE' | 'writeInt32BE';

export default class TcpStick extends EventEmitter {
  private _dataWritePosition: number = 0; // 数据存储起始位置
  private _dataReadPosition: number = 0; //数据存储结束位置
  private _dataHeadLen: dataHeadLenType = 2; //数据包头长度
  private _dataLen: number = 0; //已经接收数据的长度

  private _bufferLength: number = 512; // buffer默认长度
  private _buffer: Buffer; //申请内存

  private _readIntMethod: readIntMethodType = 'readInt16BE';
  private _writeIntMethod: writeIntMethodType = 'writeInt16BE';

  constructor(bufferLength: number) {
    super();
    if (bufferLength) this._bufferLength = bufferLength;
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

  /**
   * 设置大端接收
   * type:16  包头长度为2，short类型
   * type:32  包头长度为4，int类型
   */
  setReadIntBE(type: intType) {
    this._readIntMethod = 'readInt' + type + 'BE' as readIntMethodType;
    this._writeIntMethod = 'writeInt' + type + 'BE' as writeIntMethodType;
    this._dataHeadLen = type === 16 ? 2 : 4;
    return this;
  }

  /**
   * 设置小端接收
   * type:16  包头长度为2，short类型
   * type:32  包头长度为4，int类型
   */
  setReadIntLE(type: intType) {
    this._readIntMethod = 'readInt' + type + 'LE' as readIntMethodType;
    this._writeIntMethod = 'writeInt' + type + 'LE' as writeIntMethodType;
    this._dataHeadLen = type === 16 ? 2 : 4;
    return this;
  }

  getAvailableLen() {
    return this._bufferLength - this._dataLen;
  }

  putData(data: Buffer) {
    if (!data) return;
    //要拷贝数据的起始位置
    let dataStart = 0;
    // 要拷贝数据的结束位置
    let dataLength = data.length;
    // 缓存剩余可用空间
    let availableLen = this.getAvailableLen();

    // buffer剩余空间不足够存储本次数据
    if (availableLen < dataLength) {
      // 以512字节为基数扩展Buffer空间
      let exLength = Math.ceil((this._dataLen + dataLength) / 512) * 512;
      let tempBuffer = Buffer.alloc(exLength);
      this._bufferLength = exLength;

      // 数据存储进行了循环利用空间，需要进行重新打包
      // 数据存储在buffer的尾部+头部的顺序
      if (this._dataWritePosition < this._dataReadPosition) {
        let dataTailLen = this._bufferLength - this._dataReadPosition;
        this._buffer.copy(tempBuffer, 0, this._dataReadPosition, this._dataReadPosition + dataTailLen);
        this._buffer.copy(tempBuffer, dataTailLen, 0, this._dataWritePosition);
      }
      // 数据是按照顺序进行的完整存储
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
    // 数据会冲破buffer尾部
    else if (this._dataWritePosition + dataLength > this._bufferLength) {
      /*   分两次存储到buffer：
        *   1、存储在原数据尾部 
        *   2、存储在原数据头部
      */
      // buffer尾部剩余空间的长度
      let bufferTailLength = this._bufferLength - this._dataWritePosition;
      if (bufferTailLength < 0) {
        throw new Error('buffer尾部剩余空间的长度不能小于0');
      }
      // 数据尾部位置
      let dataEndPosition = dataStart + bufferTailLength;
      data.copy(this._buffer, this._dataWritePosition, dataStart, dataEndPosition);

      this._dataWritePosition = 0;
      dataStart = dataEndPosition;

      // data剩余未拷贝进缓存的长度
      let unDataCopyLen = dataLength - bufferTailLength;
      data.copy(this._buffer, this._dataWritePosition, dataStart, dataStart + unDataCopyLen);
      // 记录数据长度
      this._dataLen += dataLength;
      // 记录buffer可写位置
      this._dataWritePosition += unDataCopyLen;
    }
    // 剩余空间足够存储数据 
    else {
      if (this._dataWritePosition > this._bufferLength) throw new Error('something error');
      // 拷贝数据到buffer
      data.copy(this._buffer, this._dataWritePosition, dataStart, dataStart + dataLength);
      // 记录数据长度
      this._dataLen += dataLength;
      // 记录buffer可写位置
      this._dataWritePosition += dataLength;
    }
    this.getData();
  }

  putMsg(msg: string) {
    const bodyBuf = Buffer.from(msg, 'utf8');
    const headBuf = Buffer.alloc(this._dataHeadLen);

    headBuf[this.writeIntMethod](bodyBuf.byteLength, 0);

    this.putData(headBuf);
    this.putData(bodyBuf);
  }

  publish(msg: string | ArrayBuffer) {
    const bodyBuf = typeof msg === 'string' ? Buffer.from(msg, 'utf8') : Buffer.from(msg);
    const headBuf = Buffer.alloc(this._dataHeadLen);

    headBuf[this.writeIntMethod](bodyBuf.byteLength, 0);

    const msgBuf = Buffer.alloc(headBuf.length + bodyBuf.length);
    headBuf.copy(msgBuf, 0, 0, headBuf.length);
    bodyBuf.copy(msgBuf, headBuf.length, 0, bodyBuf.length);

    return msgBuf;
  }

  private getDataLen() {
    let dataLen = 0;
    // 缓存全满
    if (this._dataLen === this._bufferLength && this._dataWritePosition >= this._dataReadPosition) {
        dataLen = this._bufferLength;
    }
    // 缓存全部数据读空
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

  private getData() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // 没有数据可读,不够解析出包头
      if (this.getDataLen() <= this._dataHeadLen) break;
      // 解析包头长度
      // 尾部最后剩余可读字节长度
      let buffLastCanReadLen = this._bufferLength - this._dataReadPosition;
      let dataLen = 0;
      let headBuffer = Buffer.alloc(this._dataHeadLen);
      // 数据包为分段存储，不能直接解析出包头
      if (buffLastCanReadLen < this._dataHeadLen) {
        // 取出第一部分头部字节
        this._buffer.copy(headBuffer, 0, this._dataReadPosition, this._buffer.length);
        // 取出第二部分头部字节
        let unReadHeadLen = this._dataHeadLen - buffLastCanReadLen;
        this._buffer.copy(headBuffer, buffLastCanReadLen, 0, unReadHeadLen);
        // 默认大端接收数据
        dataLen = headBuffer[this.readIntMethod](0) + this._dataHeadLen;
      }
      else {
        this._buffer.copy(headBuffer, 0, this._dataReadPosition, this._dataReadPosition + this._dataHeadLen);
        dataLen = headBuffer[this.readIntMethod](0);
        dataLen += this._dataHeadLen;
      }
      // 数据长度不够读取，直接返回
      if (this.getDataLen() < dataLen) break;
      // 数据够读，读取数据包 
      else {
        let readData = Buffer.alloc(dataLen);
        // 数据是分段存储，需要分两次读取
        if (this._bufferLength - this._dataReadPosition < dataLen) {
          let firstPartLen = this._bufferLength - this._dataReadPosition;
          // 读取第一部分，直接到字符尾部的数据
          this._buffer.copy(readData, 0, this._dataReadPosition, firstPartLen + this._dataReadPosition);
          // 读取第二部分，存储在开头的数据
          let secondPartLen = dataLen - firstPartLen;
          this._buffer.copy(readData, firstPartLen, 0, secondPartLen);
          this._dataReadPosition = secondPartLen;
        }
        // 直接读取数据
        else {
          this._buffer.copy(readData, 0, this._dataReadPosition, this._dataReadPosition + dataLen);
            this._dataReadPosition += dataLen;
          }

          try {
            this.emit('buffer', readData);
            this._dataLen -= readData.length;
            // 已经读取完所有数据
            if (this._dataReadPosition === this._dataWritePosition) break;
          } catch (e) {
            this.emit('error', e);
          }
        }
    }
  }
}