const { getAccountById, updateAccount } = require('./accounts');
const { v4: uuidv4 } = require('uuid');

// Create a new expense
function createExpense(db, expenseData) {
  const expense = {
    _id: uuidv4(),
    description: expenseData.description,
    amount: expenseData.amount,
    date: expenseData.date,
    accountId: expenseData.accountId,
    accountName: expenseData.accountName,
    expenseType: expenseData.expenseType,
    currency: expenseData.currency,
    rate: expenseData.rate || 1,
    projectId: expenseData.projectId,
    createdAt: new Date().toISOString(),
    type: "expense",
    state: "Active"
  };
  
  return db
    .put(expense)
    .then((response) => {
      // If an account ID is provided, update the account balance
      if (expenseData.accountId) {
        return getAccountById(db, expenseData.accountId)
          .then((accountResult) => {
            if (accountResult.success) {
              let deductAmount = expenseData.amount;
              
              // Convert amount if currencies are different
              if (accountResult.account.currency !== expenseData.currency) {
                if (expenseData.currency === 'USD' && accountResult.account.currency === 'KES') {
                  deductAmount = Math.floor(expenseData.amount * expenseData.rate);
                } else if (expenseData.currency === 'KES' && accountResult.account.currency === 'USD') {
                  deductAmount = Math.floor(expenseData.amount / expenseData.rate);
                }
              }

              const updatedAccount = {
                ...accountResult.account,
                balance: accountResult.account.balance - deductAmount
              };
              
              return updateAccount(db, updatedAccount)
                .then(() => ({
                  success: true,
                  expense: { _id: response.id, ...expense }
                }));
            }
            return { success: true, expense: { _id: response.id, ...expense } };
          });
      }
      return { success: true, expense: { _id: response.id, ...expense } };
    })
    .catch((error) => ({ success: false, error: error.message }));
}

// Get all expenses
function getAllExpenses(db, projectId) {
  return db
    .find({
      selector: { 
        type: "expense",
        state: "Active",
        projectId: projectId
      },
      limit: 100000
    })
    .then((result) => ({ success: true, expenses: result.docs }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Get an expense by ID
function getExpenseById(db, expenseId) {
  return db
    .get(expenseId)
    .then((expense) => ({ success: true, expense }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Update an existing expense
function updateExpense(db, expenseData) {
  const expense = {
    _id: expenseData._id,
    type: "expense",
    state: "Active",
    ...expenseData,
  };
  return db
    .put(expense)
    .then((response) => ({
      success: true,
      expense: { _id: response.id, ...expense },
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Delete an expense
function archiveExpense(db, expenseId) {
  return db
    .get(expenseId)
    .then((expense) => {
      // Update the state field to "Inactive"
      expense.state = "Inactive";
      return db.put(expense);
    })
    .then(() => ({ success: true }))
    .catch((error) => ({ success: false, error: error.message }));
}

async function expenseSearch(db, searchTerm, projectId) {
  try {
    const searchResult = await db.find({
      selector: {
        $or: [
          { description: { $regex: new RegExp(searchTerm, 'i') } },
          { accountName: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: "Active",
        type: "expense",
        projectId: projectId
      },
      limit: 100000
    });
    return { success: true, expenses: searchResult.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function filterExpenses(db, { projectId, filterData }) {
  const selector = {
    type: "expense",
    state: "Active",
    projectId: projectId
  };

  // Add date range filter
  if (filterData.startDate && filterData.endDate) {
    selector.date = {
      $gte: filterData.startDate,
      $lte: filterData.endDate
    };
  }

  // Add expense type filter
  if (filterData.expenseType) {
    selector.expenseType = filterData.expenseType;
  }

  // Add account name filter
  if (filterData.accountName) {
    selector.accountName = filterData.accountName;
  }

  return db
    .find({
      selector,
      limit: 100000
    })
    .then(result => ({
      success: true,
      expenses: result.docs
    }))
    .catch(error => ({
      success: false,
      error: error.message
    }));
}

function getExpenseStats(db, projectId) {
  // Get all expenses for the project once
  return db.find({
    selector: {
      type: "expense",
      state: "Active",
      projectId: projectId
    },
    limit: 100000
  })
  .then(result => {
    const expenses = result.docs;
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Calculate stats with currency conversion
    const total = expenses.reduce((sum, doc) => {
      const amount = doc.currency === 'USD' ? doc.amount * doc.rate : doc.amount;
      return sum + amount;
    }, 0);

    const lastMonthExpenses = expenses
      .filter(doc => new Date(doc.date) >= lastMonth)
      .reduce((sum, doc) => {
        const amount = doc.currency === 'USD' ? doc.amount * doc.rate : doc.amount;
        return sum + amount;
      }, 0);

    const latestExpense = expenses
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null;

    return {
      success: true,
      stats: {
        totalExpenses: total,
        lastMonthExpenses: lastMonthExpenses,
        latestExpense: latestExpense
      }
    };
  })
  .catch(error => ({
    success: false,
    error: error.message
  }));
}

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  archiveExpense,
  expenseSearch,
  filterExpenses,
  getExpenseStats,
};