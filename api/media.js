/*
 * API sub-router for media endpoints
 */

const multer = require("multer");
const { Readable } = require('stream')
const { Router } = require("express");
const { GridFSBucket } = require("mongodb");
const crypto = require("crypto");
const { ObjectId } = require('mongodb')

const { validateAgainstSchema } = require("../lib/validation");
const { getDbReference } = require("../lib/mongo");
const { getPhotoById, getDownloadStreamByFilename } = require("../models/photo");

// const upload = multer({
//   storage: multer.memoryStorage()
// })

// const {
//   PhotoSchema,
//   insertNewPhoto,
//   getPhotoById,
// } = require("../models/photo");

const router = Router();

// const imageTypes = {
//   'image/jpeg': 'jpg',
//   'image/png': 'png'
// };

// function isValidMimeType(mimetype) {
//   return !!imageTypes[mimetype]
// }

// function saveImageFile(image) {
//   return new Promise((resolve, reject) => {
//     const db = getDbReference();
//     const bucket = new GridFSBucket(db, { bucketName: 'images' });
//     const filename = crypto.pseudoRandomBytes(16).toString("hex");
//     const extension = imageTypes[image.contentType];

//     const metadata = {
//       contentType: image.contentType,
//       businessId: new ObjectId(image.businessId),
//       caption: image.caption
//     };
//     const uploadStream = bucket.openUploadStream(
//       `${filename}.${extension}`,
//       { metadata: metadata }
//     );
//     const stream = new Readable.from(image.buffer)
//     stream.pipe(uploadStream).on('error', (err) => {
//       reject(err);
//     })
//     .on('finish', (result) => {
//       resolve(result._id);
//     });
//   });
// }



// // router.post('/', async (req, res) => {
// //   if (validateAgainstSchema(req.body, PhotoSchema)) {
// //     try {
// //       const id = await insertNewPhoto(req.body)
// //       res.status(201).send({
// //         id: id,
// //         links: {
// //           photo: `/photos/${id}`,
// //           business: `/businesses/${req.body.businessId}`
// //         }
// //       })
// //     } catch (err) {
// //       console.error(err)
// //       res.status(500).send({
// //         error: "Error inserting photo into DB.  Please try again later."
// //       })
// //     }
// //   } else {
// //     res.status(400).send({
// //       error: "Request body is not a valid photo object"
// //     })
// //   }
// // })

// /*
//  * POST /photos - Route to create a new photo.
//  */
// router.post("/", upload.single("upload"), async (req, res, next) => {
//   console.log("req.body = " + JSON.stringify(req.body, null, 4));

//   if (
//     validateAgainstSchema(req.body, PhotoSchema) &&
//     isValidMimeType(req.file.mimetype)
//   ) {
//     try {
//       const image = {
//         contentType: req.file.mimetype,
//         businessId: req.body.businessId,
//         caption: req.body.caption,
//         buffer: req.file.buffer,
//       };
//       const id = await saveImageFile(image);
//       res.status(201).send({
//         id: id,
//         links: {
//           photo: `/photos/${id}`,
//           business: `/businesses/${req.body.businessId}`,
//         },
//       });
//     } catch (err) {
//       console.error(err);
//       next(err);
//     }
//   } else {
//     res.status(400).send({
//       err: "Request body is not a valid photo object",
//     });
//   }
// });

async function getPhotoByFileName(filename) {
  // get the id from the filename
  const id = filename.split(".")[0]
  // get the photo
  const photo = await getPhotoById(id)
  // check if it exists and the mimetype matches (could just check that the filename matches)
  if (photo) {
      // return the photo if it exists, otherwise return null
      return photo
  } else {
    return null
  }
}

/*
 * GET /media/photos/{filename} - Route to fetch info about a specific photo.
 */
// router.get('/photos/:filename', async (req, res, next) => {
//   console.log("is this even running")
//   try {
//     const photo = await getPhotoByFileName(req.params.filename)
//     if (photo) {
//       res.status(200).send(photo)
//     } else {
//       next()
//     }
//   } catch (err) {
//     console.error(err)
//     res.status(500).send({
//       error: "Unable to fetch photo.  Please try again later."
//     })
//   }
// })

router.get('/photos/:filename', async (req, res, next) => {
  const photo = await getPhotoByFileName(req.params.filename)
  getDownloadStreamByFilename(photo.filename)
    .on('error', (err) => {
      if (err.code === 'ENOENT') {
        next();
      } else {
        next(err);
      }
    })
    .on('file', (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});

module.exports = router
