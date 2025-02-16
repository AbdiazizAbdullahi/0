const { createInvoice } = require('./invoices');
const { createTransaction } = require('./transactions');
const { createExpense } = require('./expenses');
const { createClient } = require('./clients');

// Bulk create invoices
async function bulkCreateInvoices(db, invoicesData) {
  try {
    const results = [];
    for (const invoiceData of invoicesData) {
      const result = await createInvoice(db, invoiceData);
      results.push(result);
    }
    return {
      success: true,
      results: results,
      message: `Successfully processed ${results.length} invoices`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Bulk create transactions
async function bulkCreateTransactions(db, transactionsData) {
  try {
    const results = [];
    for (const transactionData of transactionsData) {
      const result = await createTransaction(db, transactionData);
      results.push(result);
    }
    return {
      success: true,
      results: results,
      message: `Successfully processed ${results.length} transactions`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Bulk create expenses
async function bulkCreateExpenses(db, expensesData) {
  try {
    const results = [];
    for (const expenseData of expensesData) {
      const result = await createExpense(db, expenseData);
      results.push(result);
    }
    return {
      success: true,
      results: results,
      message: `Successfully processed ${results.length} expenses`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Bulk create clients
async function bulkCreateClients(db, clientsData) {
  try {
    const results = [];
    for (const clientData of clientsData) {
      const result = await createClient(db, clientData);
      results.push(result);
    }
    return {
      success: true,
      results: results,
      message: `Successfully processed ${results.length} clients`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  bulkCreateInvoices,
  bulkCreateTransactions,
  bulkCreateExpenses,
  bulkCreateClients
};
