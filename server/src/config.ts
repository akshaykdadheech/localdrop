export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  host: process.env.HOST ?? '0.0.0.0',
  pingInterval: parseInt(process.env.PING_INTERVAL ?? '20000', 10),
  roomCodeTtl: parseInt(process.env.ROOM_CODE_TTL ?? '600000', 10),
  tlsCert: process.env.TLS_CERT,
  tlsKey: process.env.TLS_KEY,
};
