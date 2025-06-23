exports.checkBudgetAlert = functions.firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snapshot, context) => {
    try {
      // 1. Fix budget calculation
      const expense = snapshot.data();
      const budgetQuery = admin.firestore().collection('budgets')
        .where('userId', '==', expense.userId)
        .where('category', '==', expense.category);
      
      const budgets = await budgetQuery.get();
      
      if (budgets.empty) {
        console.log("No budget found for category:", expense.category);
        return null;
      }
      
      const budget = budgets.docs[0].data();
      console.log("Budget data:", budget); // Debug log
      
      // 2. Fix NaN issue
      const budgetUsed = (expense.total / budget.amount) * 100;
      if (isNaN(budgetUsed)) {
        throw new Error(`Invalid calculation: ${expense.total}/${budget.amount}`);
      }
      
      console.log(`Budget usage: ${budgetUsed.toFixed(2)}%`);
      
      // 3. Add email sending
      if (budgetUsed >= budget.alertThreshold) {
        await sendAlertEmail({
          to: expense.userEmail,
          category: expense.category,
          percentage: budgetUsed.toFixed(2),
          budgetAmount: budget.amount
        });
      }
    } catch (error) {
      console.error("Function error:", error);
    }
  });

async function sendAlertEmail(data) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: data.to,
    from: 'nursuhaeka10@gmail.com', // Must be verified in SendGrid
    subject: `Budget Alert for ${data.category}`,
    text: `You've reached ${data.percentage}% of your ${data.category} budget (Limit: ${data.budgetAmount})`
  };
  
  await sgMail.send(msg);
}