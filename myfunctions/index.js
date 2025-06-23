import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import sgMail from '@sendgrid/mail';

import dotenv from 'dotenv';
dotenv.config();



// Configure function options
setGlobalOptions({
  region: 'us-central1',
  memory: '1GB',
  timeoutSeconds: 60,
  minInstances: 1, // Keep at least 1 instance warm
  maxInstances: 20
});

// Initialize Firebase
initializeApp();

// Initialize SendGrid with Firebase config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const checkBudgetAlert = onDocumentCreated(
  {
    document: 'expenses/{expenseId}',
    memory: '1GB',
    timeoutSeconds: 60
  },
  async (event) => {
    try {
      const snapshot = event.data;
      if (!snapshot.exists) {
        console.log('No document found');
        return;
      }

      const expense = snapshot.data();

      // Validate required fields and log missing fields
      const requiredFields = ['userId', 'category', 'total', 'userName'];
      const missingFields = requiredFields.filter(field => !expense[field]);

      if (missingFields.length > 0) {
        console.error(`Missing required fields: ${missingFields.join(', ')}`);
        throw new Error('Missing required expense fields');
      }

      // Log the document data for debugging purposes
      console.log('Expense Document:', expense);

      const firestore = getFirestore();
      const budgetQuery = firestore.collection('budgets')
        .where('userId', '==', expense.userId)
        .where('category', '==', expense.category);
      const expensesQuery = firestore.collection('expenses')
        .where('userId', '==', expense.userId)
        .where('category', '==', expense.category);

      // Error handling for Firestore query
      const budgets = await budgetQuery.get();
      if (budgets.empty) {
        console.log("No budget found for category:", expense.category);
        return;
      }

      const budget = budgets.docs[0].data();

      // Validate the budget amount
      if (typeof budget.amount !== 'number' || budget.amount <= 0) {
        throw new Error(`Invalid budget amount: ${budget.amount}`);
      }

      let totalExpenses = 0;
      // Get current expenses for the user and category
      const expensesSnapshot = await expensesQuery.get();
      if (expensesSnapshot.empty) {
        console.log("No expenses found for user:", expense.userId, "and category:", expense.category);
      } else {
        expensesSnapshot.forEach(doc => {
          const expData = doc.data();
          if (expData.total && typeof expData.total === 'number') {
            totalExpenses += expData.total;
          } else {
            console.warn(`Invalid expense total for document ${doc.id}:`, expData.total);
          }
        });
      }
 
      const budgetUsed = (totalExpenses / budget.amount) * 100;
      console.log(`Budget usage: ${budgetUsed.toFixed(2)}%`);

      // Check if the budget used exceeds the threshold
      const threshold = budget.alertThreshold || 80;
      if (budgetUsed >= threshold) {
        // Ensure valid email before sending the email
        if (!expense.userName || !isValidEmail(expense.userName)) {
          console.error('Invalid user email:', expense.userName);
          return;
        }

        await sgMail.send({
          to: expense.userName,
          from: 'nursuhaeka10@gmail.com',  // Ensure this is a verified email in SendGrid
          subject: `Budget Alert for ${expense.category}`,
          text: `You've reached ${budgetUsed.toFixed(2)}% of your budget for ${expense.category}`,
          html: `<strong>Budget Alert</strong><p>You've reached ${budgetUsed.toFixed(2)}% of your ${expense.category} budget (Limit: ${budget.amount})</p>`
        });
        console.log('Email sent successfully');
      }
    } catch (error) {
      console.error("Function error:", error);
    }
  }
);

// Helper function to validate email format
function isValidEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}
