/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require("mongodb");
const sharp = require("sharp");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
  businessId: { required: true },
  caption: { required: false },
};
exports.PhotoSchema = PhotoSchema;

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema);
  photo.businessId = ObjectId(photo.businessId);
  const db = getDbReference();
  const collection = db.collection("photos");
  const result = await collection.insertOne(photo);
  return result.insertedId;
}
exports.insertNewPhoto = insertNewPhoto;

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id, dbCollection) {
  const db = getDbReference();
  // const collection = db.collection('images.files')
  const collection = db.collection(dbCollection);
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection.find({ _id: new ObjectId(id) }).toArray();
    return results[0];
  }
}

const getDownloadStreamByFilename = function (filename, dbBucket) {
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: dbBucket });
  return bucket.openDownloadStreamByName(filename);
};

const getDownloadStreamById = async function (id, dbCollection, dbBucket) {
  const photo = await getPhotoById(id, dbCollection);
  return getDownloadStreamByFilename(photo.filename, dbBucket);
};

exports.createThumb = async function (id) {
  return new Promise(async (resolve, reject) => {
    const thumbnailCreator = sharp().resize(100, 100).jpeg();

    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: "thumbs" });
    const filename = `${id}.jpg`;

    const metadata = {
      contentType: "image/jpeg",
    };
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata,
    });

    const downloadStream = await getDownloadStreamById(
      id,
      "images.files",
      "images"
    );

    downloadStream
      .pipe(thumbnailCreator)
      .pipe(uploadStream)
      .on("error", (err) => {
        reject(err);
      })
      .on("finish", (result) => {
        db.collection("images.files").updateOne(
          { _id: ObjectId(id) },
          { $set: { "metadata.thumbId": result._id } }
        );
        resolve(result);
      });
  });
};

exports.getPhotoById = getPhotoById;
exports.getDownloadStreamByFilename = this.getDownloadStreamByFilename;
exports.getDownloadStreamByFilename = getDownloadStreamByFilename;
