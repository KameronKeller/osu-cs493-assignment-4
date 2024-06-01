/*
 * API sub-router for businesses collection endpoints.
 */

const multer = require("multer");
const { Readable } = require('stream')
const { Router } = require("express");
const { GridFSBucket } = require("mongodb");
const crypto = require("crypto");
const { ObjectId } = require('mongodb')

const { validateAgainstSchema } = require("../lib/validation");
const { getDbReference } = require("../lib/mongo");

const upload = multer({
  storage: multer.memoryStorage()
})

const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById,
} = require("../models/photo");
const { getMqReference, thumbQueue } = require("../lib/messageQueue");

const router = Router();

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

function isValidMimeType(mimetype) {
  return !!imageTypes[mimetype]
}

function saveImageFile(image) {
  return new Promise((resolve, reject) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const filename = crypto.pseudoRandomBytes(16).toString("hex");
    const extension = imageTypes[image.contentType];

    const metadata = {
      contentType: image.contentType,
      businessId: new ObjectId(image.businessId),
      caption: image.caption
    };
    const uploadStream = bucket.openUploadStream(
      `${filename}.${extension}`,
      { metadata: metadata }
    );
    const stream = new Readable.from(image.buffer)
    stream.pipe(uploadStream).on('error', (err) => {
      reject(err);
    })
    .on('finish', (result) => {
      resolve(result._id);
    });
  });
}



// async function addToThumbQueue(photo) {
//   try {
//     const connection = await amqp.connect(rabbitmqUrl);
//     const channel = await connection.createChannel();
//     await channel.assertQueue('generateThumb');
//     setTimeout(() => { connection.close(); }, 500);
//   } catch (err) {
//     console.error(err);
//   }
// }


/*
 * POST /photos - Route to create a new photo.
 */
router.post("/", upload.single("upload"), async (req, res, next) => {
  console.log("req.body = " + JSON.stringify(req.body, null, 4));

  if (
    validateAgainstSchema(req.body, PhotoSchema) &&
    isValidMimeType(req.file.mimetype)
  ) {
    try {
      const image = {
        contentType: req.file.mimetype,
        businessId: req.body.businessId,
        caption: req.body.caption,
        buffer: req.file.buffer,
      };
      const id = await saveImageFile(image);
      const mq = getMqReference()
      mq.sendToQueue(thumbQueue, Buffer.from(id.toString()))
      res.status(201).send({
        id: id,
        links: {
          photo: `/photos/${id}`,
          business: `/businesses/${req.body.businessId}`,
          photoUrl: `/media/photos/${id}.${imageTypes[req.file.mimetype]}`,
          thumbnail: `/media/thumbs/${id}.${imageTypes[req.file.mimetype]}`
        },
      });
    } catch (err) {
      console.error(err);
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body is not a valid photo object",
    });
  }
});

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id, 'images.files')
    if (photo) {
      photo.photoUrl = `/media/photos/${photo._id}.${imageTypes[photo.metadata.contentType]}`
      photo.thumbnail = `/media/thumbs/${photo._id}.${imageTypes[photo.metadata.contentType]}`
      res.status(200).send(photo)
    } else {
      next()
    }
  } catch (err) {
    console.error(err)
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    })
  }
})

module.exports = router
