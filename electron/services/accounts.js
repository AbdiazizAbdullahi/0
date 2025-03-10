// Create a new account
function createAccount(db, accountData) {
  const account = {
    _id: accountData._id,
    name: accountData.name,
    balance: accountData.balance,
    currency: accountData.currency || 'KES',
    projectId: accountData.projectId,
    createdAt: new Date().toISOString(),
    type: "account",
    state: "Active"
  };
  return db
    .put(account)
    .then((response) => ({
      success: true,
      account: { _id: response.id, ...account },
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Get all accounts
function getAllAccounts(db, projectId) {
  return db
    .find({
      selector: { 
        type: "account",
        state: "Active",
        projectId: projectId
      },
    })
    .then((result) => ({ success: true, accounts: result.docs }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Get an account by ID
function getAccountById(db, accountId) {
  return db
    .get(accountId)
    .then((account) => ({ success: true, account }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Update an existing account
function updateAccount(db, accountData) {
  const account = {
    _id: accountData._id,
    type: "account",
    state: "Active",
    ...accountData,
  };
  return db
    .put(account)
    .then((response) => ({
      success: true,
      account: { _id: response.id, ...account },
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Delete an account (soft delete by changing state)
function archiveAccount(db, accountId) {
  return db
    .get(accountId)
    .then((account) => {
      // Update the state field to "Inactive"
      account.state = "Inactive";
      return db.put(account);
    })
    .then(() => ({ success: true }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Calculate account totals
function getAccountTotals(db, projectId) {
  return db
    .find({
      selector: {
        projectId: projectId,
        $or: [
          { type: "sale" },
          { type: "expense" },
          { type: "invoice" },
          { type: "transaction" }
        ]
      },
      limit: 100000
    })
    .then((result) => {
      let totalCredit = 0;
      let totalDebit = 0;

      result.docs.forEach(doc => {
        if (doc.type === "sale") {
          totalCredit += Number(doc.price || 0);
          totalCredit += Number(doc.commission || 0);
        } else if (doc.type === "expense") {
          totalCredit += Number(doc.amount || 0);
        } else if (doc.type === "invoice") {
          totalDebit += Number(doc.amount || 0);
        } else if (doc.type === "transaction") {
          if (doc.transType === "withdrawal") {
            totalCredit += Number(doc.amount || 0);
          } else if (doc.transType === "deposit") {
            totalDebit += Number(doc.amount || 0);
          }
        }
      });

      const totalBalance = totalDebit - totalCredit;

      return {
        success: true,
        totals: {
          totalCredit,
          totalDebit,
          totalBalance
        }
      };
    })
    .catch((error) => ({ success: false, error: error.message }));
}

module.exports = {                                                    
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  archiveAccount,
  getAccountTotals
};
