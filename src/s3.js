const path = require('path');
require('dotenv').config({path:__dirname+'/.env'})
const fs = require('fs');
const S3 = require ('aws-sdk/clients/s3');

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccesKey = process.env.AWS_SECRET_KEY

const s3 = new S3({
    region,
    accessKeyId,
    secretAccesKey
})

// Subidas
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path)
    // console.log(bucketName)
    // console.log(region)
    // console.log(accessKeyId)

    const uploadParams = {
      Bucket: bucketName,
      Body: fileStream,
      Key: file.filename
    }
  
    return s3.upload(uploadParams).promise()
  }
  exports.uploadFile = uploadFile

// Bajadas

function getFileStream(fileKey) {
    const downloadParams = {
      Key: fileKey,
      Bucket: bucketName
    }
  
    return s3.getObject(downloadParams).createReadStream()
  }
  exports.getFileStream = getFileStream