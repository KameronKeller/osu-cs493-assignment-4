const { connectToMq, getMqReference, thumbQueue } = require("./lib/messageQueue");
const { connectToDb } = require("./lib/mongo");
const { createThumb } = require("./models/photo");

connectToDb(function () {
    connectToMq(function() {
        const mq = getMqReference()
        mq.consume(thumbQueue, async (msg) => {
            if (msg) {
                console.log(msg.content.toString());
                //getDownloadStreamById()
                //updateImageSizeById()
                const id = msg.content.toString();
                // const downloadStream = getDownloadStreamById(id);
                // const imageData = [];
                // downloadStream.on('data', (data) => {
                //   imageData.push(data);
                // });
                // downloadStream.on('end', async () => {
                    // const dimensions = sizeOf(Buffer.concat(imageData));
                    const result = await createThumb(id);
                    console.log("== result", result);
                //   });
            }
            mq.ack(msg);
        });
    })
})