// Correct way to export functions:
exports.setup2FAv2 = functions.region("asia-southeast1").https.onCall((data, context) => {
  // Your implementation here
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Only authenticated users can access this function'
    );
  }
  
  // Add your 2FA setup logic here
  return { status: 'success' };
});