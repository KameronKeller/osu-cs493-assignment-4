/*
 * API sub-router for businesses collection endpoints.
 */

const multer = require("multer");
const { Readable } = require('stream')
const { Router } = require("express");
const { GridFSBucket } = require("mongodb");

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

const router = Router();

function saveImageFile(image) {
  return new Promise((resolve, reject) => {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });
    const metadata = {
      contentType: image.contentType,
      businessId: image.businessId,
      caption: image.caption
    };
    const uploadStream = bucket.openUploadStream(
      'asdf',
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



// router.post('/', async (req, res) => {
//   if (validateAgainstSchema(req.body, PhotoSchema)) {
//     try {
//       const id = await insertNewPhoto(req.body)
//       res.status(201).send({
//         id: id,
//         links: {
//           photo: `/photos/${id}`,
//           business: `/businesses/${req.body.businessId}`
//         }
//       })
//     } catch (err) {
//       console.error(err)
//       res.status(500).send({
//         error: "Error inserting photo into DB.  Please try again later."
//       })
//     }
//   } else {
//     res.status(400).send({
//       error: "Request body is not a valid photo object"
//     })
//   }
// })

/*
 * POST /photos - Route to create a new photo.
 */
router.post("/", upload.single("upload"), async (req, res, next) => {
  console.log("req.body = " + JSON.stringify(req.body, null, 4));

  // TODO: Fix this if statement
  // if (req.file && req.body && req.body.userId) {
  if (true) {
    try {
      const image = {
        contentType: req.file.mimetype,
        businessId: req.body.businessId,
        caption: req.body.caption,
        buffer: req.file.buffer,
      };
      const id = await saveImageFile(image);
      res.status(200).send({ id: id });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      err: "Request body needs'image' file and 'userId'.",
    });
  }
});

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id)
    if (photo) {
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
