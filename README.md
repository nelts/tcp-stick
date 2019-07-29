# @nelts/tcp-stick

解决TCP传输数据时候的粘包和拆包问题。本项目克隆自[stickpackage](https://github.com/lvgithub/stick)，感谢源作者提供思路和代码。本人在源项目基础上修改为TS支持，同时修改了部分源码。

## usage

```bash
npm i @nelts/tcp-stick
```

## example

```ts
import * as net from 'net';
import { Messager } from '@nelts/tcp-stick';
const d = require('../package-lock.json');

const server = net.createServer((socket: net.Socket) => {
  const msg = new Messager();
  socket.on('data', (data) => msg.putData(data));
  socket.on('close', () => console.log('client disconnected'));
  socket.on('error', error => console.log(`error:客户端异常断开: ${error}`));
  msg.on('data', data => {
    console.log('[Server Data]', data.toString());
    socket.write(msg.publish('hello world1'));
    socket.write(msg.publish('hello world2'));
  });
  // socket.write(JSON.stringify(d));
  // socket.write(JSON.stringify(d));
  // socket.write(JSON.stringify(d));
});

server.listen(9000, () => {
  console.log('start server at 9000');
  makeClient(1);
  // makeClient(2);
});

function makeClient(id: number) {
  const client = net.createConnection({ port: 9000, host: '127.0.0.1' });
  const msg = new Messager();
  client.on('data', (data) => msg.putData(data));
  msg.on('data', data => console.log('[Client Data]', data.toString()))
  const data = msg.publish(JSON.stringify(d));
  client.write(data);
  client.write(data);
  // client.on('end', () => {
  //   console.log('server end.', id)
  // })
  // client.write(id + ' hello world!');
  // client.write(id + ' hello world!');
  // client.write(JSON.stringify(d));
  // client.write(JSON.stringify(d));
  // client.write(JSON.stringify(d));
  // client.write(JSON.stringify(d));
}
```

output:

```bash
start server at 9000
[Server Data] {"name":"@nelts/tcp-stick","version":"1.0.0","lockfileVersion":1,"requires":true,"dependencies":{"@types/node":{"version":"12.6.8","resolved":"https://registry.npm.taobao.org/@types/node/download/@types/node-12.6.8.tgz","integrity":"sha1-5Gm0v50cmDKu5JB7qKBRSUNXwSw=","dev":true},"arg":{"version":"4.1.1","resolved":"https://registry.npm.taobao.org/arg/download/arg-4.1.1.tgz","integrity":"sha1-SF+OfDkM5MX3glfb6oDUvhH+2kw=","dev":true},"buffer-from":{"version":"1.1.1","resolved":"https://registry.npm.taobao.org/buffer-from/download/buffer-from-1.1.1.tgz","integrity":"sha1-MnE7wCj3XAL9txDXx7zsHyxgcO8=","dev":true},"diff":{"version":"4.0.1","resolved":"https://registry.npm.taobao.org/diff/download/diff-4.0.1.tgz","integrity":"sha1-DGZ8tGfru1zqfxTxNcwtuneAqP8=","dev":true},"make-error":{"version":"1.3.5","resolved":"https://registry.npm.taobao.org/make-error/download/make-error-1.3.5.tgz","integrity":"sha1-7+ToH22yjK3WBccPKcgxtY73dsg=","dev":true},"source-map":{"version":"0.6.1","resolved":"https://registry.npm.taobao.org/source-map/download/source-map-0.6.1.tgz","integrity":"sha1-dHIq8y6WFOnCh6jQu95IteLxomM=","dev":true},"source-map-support":{"version":"0.5.12","resolved":"https://registry.npm.taobao.org/source-map-support/download/source-map-support-0.5.12.tgz","integrity":"sha1-tPOxDVGFelrwE4086AA7IBYT1Zk=","dev":true,"requires":{"buffer-from":"^1.0.0","source-map":"^0.6.0"}},"ts-node":{"version":"8.3.0","resolved":"https://registry.npm.taobao.org/ts-node/download/ts-node-8.3.0.tgz","integrity":"sha1-5AWWGEETcZJKH7XzsSWRXzJO+1c=","dev":true,"requires":{"arg":"^4.1.0","diff":"^4.0.1","make-error":"^1.1.1","source-map-support":"^0.5.6","yn":"^3.0.0"}},"typescript":{"version":"3.5.3","resolved":"https://registry.npm.taobao.org/typescript/download/typescript-3.5.3.tgz","integrity":"sha1-yDD2V/k/HqhGgZ6SkJL1/lmD6Xc=","dev":true},"yn":{"version":"3.1.0","resolved":"https://registry.npm.taobao.org/yn/download/yn-3.1.0.tgz","integrity":"sha1-/L4ttjYQNhr8xeueCskel20EYRQ=","dev":true}}}
[Server Data] {"name":"@nelts/tcp-stick","version":"1.0.0","lockfileVersion":1,"requires":true,"dependencies":{"@types/node":{"version":"12.6.8","resolved":"https://registry.npm.taobao.org/@types/node/download/@types/node-12.6.8.tgz","integrity":"sha1-5Gm0v50cmDKu5JB7qKBRSUNXwSw=","dev":true},"arg":{"version":"4.1.1","resolved":"https://registry.npm.taobao.org/arg/download/arg-4.1.1.tgz","integrity":"sha1-SF+OfDkM5MX3glfb6oDUvhH+2kw=","dev":true},"buffer-from":{"version":"1.1.1","resolved":"https://registry.npm.taobao.org/buffer-from/download/buffer-from-1.1.1.tgz","integrity":"sha1-MnE7wCj3XAL9txDXx7zsHyxgcO8=","dev":true},"diff":{"version":"4.0.1","resolved":"https://registry.npm.taobao.org/diff/download/diff-4.0.1.tgz","integrity":"sha1-DGZ8tGfru1zqfxTxNcwtuneAqP8=","dev":true},"make-error":{"version":"1.3.5","resolved":"https://registry.npm.taobao.org/make-error/download/make-error-1.3.5.tgz","integrity":"sha1-7+ToH22yjK3WBccPKcgxtY73dsg=","dev":true},"source-map":{"version":"0.6.1","resolved":"https://registry.npm.taobao.org/source-map/download/source-map-0.6.1.tgz","integrity":"sha1-dHIq8y6WFOnCh6jQu95IteLxomM=","dev":true},"source-map-support":{"version":"0.5.12","resolved":"https://registry.npm.taobao.org/source-map-support/download/source-map-support-0.5.12.tgz","integrity":"sha1-tPOxDVGFelrwE4086AA7IBYT1Zk=","dev":true,"requires":{"buffer-from":"^1.0.0","source-map":"^0.6.0"}},"ts-node":{"version":"8.3.0","resolved":"https://registry.npm.taobao.org/ts-node/download/ts-node-8.3.0.tgz","integrity":"sha1-5AWWGEETcZJKH7XzsSWRXzJO+1c=","dev":true,"requires":{"arg":"^4.1.0","diff":"^4.0.1","make-error":"^1.1.1","source-map-support":"^0.5.6","yn":"^3.0.0"}},"typescript":{"version":"3.5.3","resolved":"https://registry.npm.taobao.org/typescript/download/typescript-3.5.3.tgz","integrity":"sha1-yDD2V/k/HqhGgZ6SkJL1/lmD6Xc=","dev":true},"yn":{"version":"3.1.0","resolved":"https://registry.npm.taobao.org/yn/download/yn-3.1.0.tgz","integrity":"sha1-/L4ttjYQNhr8xeueCskel20EYRQ=","dev":true}}}
[Client Data] hello world1
[Client Data] hello world2
[Client Data] hello world1
[Client Data] hello world2
```