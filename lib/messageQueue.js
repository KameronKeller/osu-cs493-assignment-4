/*
 * Module for working with RabbitMQ.
 */

const amqp = require("amqplib");
process.loadEnvFile();
const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const thumbQueue = "generateThumb"
// const rabbitmqUrl = `amqp://localhost`;

let channel = null;
// let _closeDbConnection = null
exports.connectToMq = async function (callback) {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertQueue(thumbQueue);
    callback();
  } catch (err) {
    console.error(err);
  }
};

exports.getMqReference = function () {
  return channel;
};

exports.thumbQueue = thumbQueue

// async function addToThumbQueue(photo) {
//     try {
//       const connection = await amqp.connect(rabbitmqUrl);
//       const channel = await connection.createChannel();
//       await channel.assertQueue('generateThumb');
//       setTimeout(() => { connection.close(); }, 500);
//     } catch (err) {
//       console.error(err);
//     }
//   }
