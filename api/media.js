/*
 * API sub-router for media endpoints
 */

const { Router } = require("express");
const {
  getPhotoById,
  getDownloadStreamByFilename,
} = require("../models/photo");

const router = Router();

async function getPhotoByFileName(filename) {
  const id = filename.split(".")[0];
  const photo = await getPhotoById(id, "images.files");
  if (photo) {
    return photo;
  } else {
    return null;
  }
}

router.get("/photos/:filename", async (req, res, next) => {
  const photo = await getPhotoByFileName(req.params.filename);
  getDownloadStreamByFilename(photo.filename, "images")
    .on("error", (err) => {
      if (err.code === "ENOENT") {
        next();
      } else {
        next(err);
      }
    })
    .on("file", (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});

router.get("/thumbs/:filename", async (req, res, next) => {
  const photo = await getPhotoByFileName(req.params.filename);
  const thumb = await getPhotoById(photo.metadata.thumbId, "thumbs.files");
  getDownloadStreamByFilename(thumb.filename, "thumbs")
    .on("error", (err) => {
      if (err.code === "ENOENT") {
        next();
      } else {
        next(err);
      }
    })
    .on("file", (file) => {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});

module.exports = router;
