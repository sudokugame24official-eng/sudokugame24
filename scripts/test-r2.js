const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');

async function runTest() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_MEDIA_BUCKET;
  const publicUrl = process.env.S3_PUBLIC_URL;

  console.log("-----------------------------------------");
  console.log("🔍 DÉMARRAGE DU TEST CLOUDFLARE R2");
  console.log("-----------------------------------------");
  
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    console.error("❌ R2 CONFIGURATION: FAIL (Variables manquantes)");
    if (!accountId) console.error(" - R2_ACCOUNT_ID manquant");
    if (!accessKeyId) console.error(" - R2_ACCESS_KEY_ID manquant");
    if (!secretAccessKey) console.error(" - R2_SECRET_ACCESS_KEY manquant");
    if (!bucketName) console.error(" - R2_MEDIA_BUCKET manquant");
    if (!publicUrl) console.error(" - S3_PUBLIC_URL manquant");
    process.exit(1);
  }
  console.log("✅ R2 CONFIGURATION: PASS");

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const testKey = `test-r2-${Date.now()}.txt`;
  const testContent = "Test d'intégration Cloudflare R2 - SudokuGame24";

  try {
    // 1. WRITE TEST
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    }));
    console.log("✅ R2 WRITE TEST: PASS");

    // 2. READ / EXISTENCE TEST
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: testKey }));
    console.log("✅ R2 READ/EXISTENCE TEST: PASS");

    // 3. PUBLIC MEDIA URL TEST
    const finalUrl = `${publicUrl}/${testKey}`;
    const publicUrlWorks = await new Promise((resolve) => {
      https.get(finalUrl, (res) => {
        resolve(res.statusCode === 200);
      }).on('error', () => resolve(false));
    });
    
    if (publicUrlWorks) {
      console.log(`✅ PUBLIC MEDIA URL: PASS (${finalUrl})`);
    } else {
      console.error(`❌ PUBLIC MEDIA URL: FAIL (${finalUrl}) - Le fichier existe sur R2, mais l'URL HTTP publique a retourné une erreur (potentiellement un délai de propagation DNS/Cloudflare ou le domaine n'est pas bien relié au bucket).`);
    }

  } catch (error) {
    console.error(`❌ ERREUR EN COURS DE TEST :`, error.message);
  } finally {
    // 4. CLEANUP TEST
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: testKey }));
      console.log("✅ CLEANUP TEST: PASS");
    } catch (cleanupError) {
      console.error("❌ CLEANUP TEST: FAIL", cleanupError.message);
    }
  }
  console.log("-----------------------------------------");
}

runTest();
