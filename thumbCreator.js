const {
  connectToMq,
  getMqReference,
  thumbQueue,
} = require("./lib/messageQueue");
const { connectToDb } = require("./lib/mongo");
const { createThumb } = require("./models/photo");

connectToDb(function () {
  connectToMq(function () {
    const mq = getMqReference();
    mq.consume(thumbQueue, async (msg) => {
      if (msg) {
        const id = msg.content.toString();
        await createThumb(id);
      }
      mq.ack(msg);
    });
  });
});
