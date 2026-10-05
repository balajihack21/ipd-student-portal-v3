// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// export const supabase = createClient(supabaseUrl, supabaseKey);



import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

export const supabase = new S3Client({
  region: "us-east-005", // From your bucket endpoint
  endpoint: `https://s3.us-east-005.backblazeb2.com`,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

