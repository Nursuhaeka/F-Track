const admin = require("firebase-admin");
const functions = require("firebase-functions");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");

// Initialize with service account
const serviceAccount = require("./service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

// Encryption setup
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'your-encryption-key', 'hex');
const IV = Buffer.from(process.env.IV || 'your-iv', 'hex');

// Helper functions
function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, IV);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encryptedData: encrypted,
    authTag: cipher.getAuthTag().toString('hex')
  };
}

function decrypt(encryptedData, authTag) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, IV);
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}