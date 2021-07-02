import express from 'express';
import Client from './structures/ExtendedClient.js';

const app = express();
const client = new Client();

app.get('/', (req, res) => {
  res.send(client?.ws?.ping ? 'online' : 'offline');
});

app.listen(process.env.PORT ?? 3000, () => {
  console.log('Server is running...');
  client.login(process.env.BOT_TOKEN);
});
