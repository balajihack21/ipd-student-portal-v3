// migrateFileUrls.js
import TeamUpload from "./models/TeamUpload.js";

async function migrateFileUrls() {
  const uploads = await TeamUpload.findAll();

  for (const upload of uploads) {
    try {
      if (!upload.file_url) {
        console.warn(`Skipping ${upload.id}: no file_url found`);
        continue;
      }

      // Remove query params
      const urlWithoutParams = upload.file_url.split("?")[0];

      // Extract file key after bucket folder (adjust "IPDUploads" if folder differs)
      const parts = urlWithoutParams.split("/IPDUploads/");
      if (parts.length < 2) {
        console.warn(`Skipping ${upload.id}: unexpected URL format → ${upload.file_url}`);
        continue;
      }

      const fileKey = decodeURIComponent(parts[1]);

      // Always update/overwrite file_key
      upload.file_key = fileKey;
      await upload.save();

      console.log(`✅ Updated: ${upload.id} → ${fileKey}`);
    } catch (err) {
      console.error(`❌ Error updating upload ${upload.id}:`, err.message);
    }
  }
}

migrateFileUrls().then(() => {
  console.log("🎉 Migration complete for all uploads");
  process.exit();
});
