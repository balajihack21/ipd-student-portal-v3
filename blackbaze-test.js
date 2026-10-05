import https from "https";
import AWS from "@aws-sdk";

const s3 = new AWS.S3({
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  region: "us-east-005",
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  s3ForcePathStyle: true,
  httpOptions: {
    agent: new https.Agent({ family: 4 }) // force IPv4
  }
});
