import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

// Create Backblaze B2 S3 client
const b2 = new S3Client({
  endpoint: "https://s3.us-east-005.backblazeb2.com", // B2 S3 endpoint
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
  forcePathStyle: true, // required for Backblaze
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ family: 4 }), // ✅ Force IPv4
  }),
});

export async function uploadToBackblaze(buffer, fileName, mimeType) {
  const key = `teamuploads/${uuidv4()}-${fileName}`;

  await b2.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  // Generate signed download URL (valid 1 hour)
  const signedUrl = await getSignedUrl(
    b2,
    new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: 3600 }
  );

  return { key, signedUrl };
}
