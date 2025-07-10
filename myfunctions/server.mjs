import express from 'express';
import admin from 'firebase-admin';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';

// Initialize Express app
const app = express();
app.use(bodyParser.json());

// Resolve the current directory name (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = path.join(__dirname, 'f-track-e5c35-firebase-adminsdk-fbsvc-c6fdfbfe53.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Webhook endpoint for Dialogflow
app.post('/webhook', async (req, res) => {
  const parameters = req.body.queryResult.parameters;  // Extract parameters
  const userEmail = parameters.email;  // Example: get the user's email from the parameters

  if (!userEmail) {
    return res.json({
      fulfillmentText: "Please provide your email so I can look up your financial data.",
    });
  }

  try {
    // Step 1: Find userId using the email
    const userQuery = db.collection('users').where('email', '==', userEmail);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return res.json({
        fulfillmentText: `Sorry, we couldn't find any data for ${userEmail}.`,
      });
    }

    const userDoc = userSnapshot.docs[0]; // Take the first user document that matches the email
    const userId = userDoc.id; // Get the userId (Document ID)

    // Step 2: Fetch and sum total expenses from the 'expenses' collection
    const expensesSnapshot = await db.collection('expenses').where('userId', '==', userId).get();
    let totalExpenses = 0;
    expensesSnapshot.forEach(doc => {
      const data = doc.data();
      totalExpenses += data.total || 0;
    });

    // Step 3: Fetch and sum total budgets from the 'budgets' collection
    const budgetsSnapshot = await db.collection('budgets').where('userId', '==', userId).get();
    let totalBudget = 0;
    budgetsSnapshot.forEach(doc => {
      const data = doc.data();
      totalBudget += data.amount || 0;
    });

    // Step 4: Fetch and sum total incomes from the 'incomes' collection
    const incomesSnapshot = await db.collection('incomes').where('userId', '==', userId).get();
    let totalIncome = 0;
    incomesSnapshot.forEach(doc => {
      const data = doc.data();
      totalIncome += data.amount || 0;
    });

    // Step 5: Construct the response with the fetched data
    const response = {
      fulfillmentText: `
      Here’s the summary of your financial data:
      - 📥 Total Income: RM ${totalIncome.toFixed(2)}
      - 📤 Total Expenses: RM ${totalExpenses.toFixed(2)}
      - 📝 Total Budget: RM ${totalBudget.toFixed(2)}
      `.trim(),
    };

    // Send the response back to Dialogflow
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching data from Firestore:', error);
    res.json({
      fulfillmentText: "There was an error retrieving your financial data. Please try again later.",
    });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook server is running on port ${PORT}`);
});
