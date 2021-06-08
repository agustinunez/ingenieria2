const path = require('path');
require('dotenv').config({path:__dirname+'/public/.env'})
const fs = require('fs');
const AWS = require ('aws-sdk');

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccesKey = process.env.AWS_SECRET_KEY

//En produccion, usar loadConfigFromFile o variables de entorno(.env) para proteger las keys.
AWS.config.update({
  accessKeyId: "AKIAW3SIHAWB3VFWNL55",
  secretAccessKey: "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",
  region: "us-east-1"
})
const s3 = new AWS.S3();

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