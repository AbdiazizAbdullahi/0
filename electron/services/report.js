async function generateIncomeStatement(db, projectId) {
  try {
    // Fetch all sales
    const salesResult = await db.find({
      selector: {
        type: 'sale',
        state: 'Active',
        projectId: projectId
      },
      limit: 100000
    });

    // Fetch all supplier invoices
    const invoicesResult = await db.find({
      selector: {
        type: 'invoice',
        state: 'Active',
        projectId: projectId
      },
      limit: 100000
    });

    // Fetch all expenses
    const expensesResult = await db.find({
      selector: {
        type: 'expense',
        state: 'Active',
        projectId: projectId
      },
      limit: 100000
    });

    // Fetch all customer transactions (payments received)
    const customerTransactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        source: 'client', // Assuming 'customer' is the type for customer payments
        projectId: projectId
      },
      limit: 100000
    });

    // Calculate totals
    let totalDebit = 0;
    let cost = 0;
    let totalExpenses = 0;
    let totalAmountPaid = 0;

    // Add sales revenue to total debit
    salesResult.docs.forEach(sale => {
      const price = sale.currency === 'USD' ? Number(sale.price) * Number(sale.rate) : Number(sale.price);
      totalDebit += price || 0;
      cost += Number(sale.commission) || 0; // Add commissions to cost
    });

    // Add supplier invoices to cost
    invoicesResult.docs.forEach(invoice => {
      const amount = invoice.currency === 'USD' ? Number(invoice.amount) * Number(invoice.rate) : Number(invoice.amount);
      cost += amount || 0;
    });

    // Add expenses
    expensesResult.docs.forEach(expense => {
      const amount = expense.currency === 'USD' ? Number(expense.amount) * Number(expense.rate) : Number(expense.amount);
      totalExpenses += amount || 0;
    });

    // Calculate total amount paid from customer transactions
    customerTransactionsResult.docs.forEach(transaction => {
      // Assuming 'deposit' transactions from customers are payments
      // And that 'amount' needs conversion similar to sales/expenses if in USD
      if (transaction.transType === 'deposit') { // Or whatever signifies a payment received
        const amount = transaction.currency === 'USD' ? Number(transaction.amount) * Number(transaction.rate) : Number(transaction.amount);
        totalAmountPaid += amount || 0;
      }
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
      incomeStatement,
      totalAmountPaid // Add totalAmountPaid here
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