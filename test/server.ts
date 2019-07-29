import * as net from 'net';
import { Messager } from '../src/index';
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