const { StreamChat } = require('stream-chat');

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

module.exports = { serverClient };