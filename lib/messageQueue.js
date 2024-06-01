/*
 * Module for working with RabbitMQ.
 */

const amqp = require("amqplib");
process.loadEnvFile();
const rabbitmqHost = process.env.RABBITMQ_HOST || "localhost";
const rabbitmqUrl = `amqp://${rabbitmqHost}`;
const thumbQueue = "generateThumb";

let channel = null;
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

exports.thumbQueue = thumbQueue;
