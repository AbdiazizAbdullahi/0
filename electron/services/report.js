async function generateIncomeStatement(db, projectId) {
  try {
    // Fetch all sales
    const salesResult = await db.find({
      selector: {
        type: 'sale',
        state: 'Active',
        projectId: projectId
      }
    });

    // Fetch all supplier invoices
    const invoicesResult = await db.find({
      selector: {
        type: 'invoice',
        state: 'Active',
        projectId: projectId
      }
    });

    // Fetch all expenses
    const expensesResult = await db.find({
      selector: {
        type: 'expense',
        state: 'Active',
        projectId: projectId
      }
    });

    // Calculate totals
    let totalDebit = 0;
    let cost = 0;
    let totalExpenses = 0;

    // Add sales revenue to total debit
    salesResult.docs.forEach(sale => {
      totalDebit += sale.price || 0;
      cost += sale.commission || 0; // Add commissions to cost
    });

    // Add supplier invoices to cost
    invoicesResult.docs.forEach(invoice => {
      cost += invoice.amount || 0;
    });

    // Add expenses
    expensesResult.docs.forEach(expense => {
      totalExpenses += expense.amount || 0;
    });

    const totalCredit = cost + totalExpenses;
    const balance = totalDebit - totalCredit;

    // Prepare income statement
    const incomeStatement = {
      revenue: totalDebit,
      cost: cost,
      grossProfit: totalDebit - cost,
      expenses: totalExpenses,
      netProfit: totalDebit - totalCredit
    };

    return {
      success: true,
      totals: {
        totalDebit,
        cost,
        totalExpenses,
        totalCredit,
        balance
      },
      incomeStatement
    };
  } catch (error) {
    console.error('Income statement generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateIncomeStatement
};