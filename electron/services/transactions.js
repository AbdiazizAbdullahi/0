const { v4: uuidv4 } = require('uuid');

// Create a new transaction
async function createTransaction(db, transactionData) {
  try {
    // Validate transaction data
    if (!transactionData.from || !transactionData.to || !transactionData.amount) {
      throw new Error('Missing required fields');
    }

    // Get source and destination documents
    let sourceDoc, destDoc;
    
    if (transactionData.source === 'account') {
      sourceDoc = await db.get(transactionData.from);
    } else {
      const sourceResult = await db.find({
        selector: {
          _id: transactionData.from,
          type: transactionData.source
        }
      });
      sourceDoc = sourceResult.docs[0];
    }

    if (transactionData.destination === 'account') {
      destDoc = await db.get(transactionData.to);
    } else {
      const destResult = await db.find({
        selector: {
          _id: transactionData.to,
          type: transactionData.destination
        }
      });
      destDoc = destResult.docs[0];
    }

    if (!sourceDoc || !destDoc) {
      throw new Error('Source or destination not found');
    }

    // Handle currency conversions
    let sourceAmount = transactionData.amount;
    let destAmount = transactionData.amount;
    
    // If currencies differ, convert amounts
    // Default currencies to KES if not specified
    const sourceCurrency = sourceDoc.currency || 'KES';
    const destCurrency = destDoc.currency || 'KES';

    if (transactionData.currency === 'KES') {
      if (sourceCurrency === 'USD' && destCurrency === 'KES') {
        sourceAmount = Math.floor(transactionData.amount / transactionData.rate);
      } else if (sourceCurrency === 'KES' && destCurrency === 'USD') {
        destAmount = Math.floor(transactionData.amount / transactionData.rate);
      } else if (sourceCurrency === 'USD' && destCurrency === 'USD') {
        sourceAmount = Math.floor(transactionData.amount / transactionData.rate);
        destAmount = Math.floor(transactionData.amount / transactionData.rate);
      }
    } else if (transactionData.currency === 'USD') {
      if (sourceCurrency === 'KES' && destCurrency === 'KES') {
        sourceAmount = Math.floor(transactionData.amount * transactionData.rate);
        destAmount = Math.floor(transactionData.amount * transactionData.rate);
      } else if (sourceCurrency === 'KES' && destCurrency === 'USD') {
        sourceAmount = Math.floor(transactionData.amount * transactionData.rate);
      } else if (sourceCurrency === 'USD' && destCurrency === 'KES') {
        destAmount = Math.floor(transactionData.amount * transactionData.rate);
      }
    }

    // Update balances
    if (transactionData.transType === 'withdraw') {
      if (transactionData.destination === 'account') {
        sourceDoc.balance -= sourceAmount;
        destDoc.balance += destAmount;
      } else if (transactionData.destination !== 'account') {
        sourceDoc.balance -= sourceAmount;
        destDoc.balance -= destAmount;
      }
    } else if (transactionData.transType === 'deposit') {
      if (transactionData.source === 'account') {
        sourceDoc.balance -= sourceAmount;
        destDoc.balance += destAmount;
      } else if (transactionData.source !== 'account') {
        sourceDoc.balance += sourceAmount;
        destDoc.balance += destAmount;
      }
    }

    // Create transaction record
    const transaction = {
      _id: uuidv4(),
      from: transactionData.from,
      fromName: transactionData.fromName,
      to: transactionData.to,
      toName: transactionData.toName,
      source: transactionData.source,
      destination: transactionData.destination,
      description: transactionData.description,
      amount: transactionData.amount,
      currency: transactionData.currency,
      rate: transactionData.rate,
      date: transactionData.date,
      transType: transactionData.transType,
      projectId: transactionData.projectId,
      type: "transaction",
      state: "Active",
      createdAt: new Date().toISOString(),
    };

    // Update documents in database
    await db.put(sourceDoc);
    await db.put(destDoc);
    await db.put(transaction);

    return {
      success: true,
      transaction: { _id: transaction._id, ...transaction }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
  
// Get all transactions
async function getAllTransactions(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: "transaction",
        state: "Active",
        projectId: projectId
      },
      limit: 100000
    });

    return { success: true, transactions: result.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get a transaction by ID
async function getTransactionById(db, transactionId) {
  try {
    const transaction = await db.get(transactionId);
    const fromDoc = await db.get(transaction.from);
    const toDoc = await db.get(transaction.to);
    
    return { 
      success: true, 
      transaction: {
        ...transaction,
        fromName: fromDoc.name,
        toName: toDoc.name
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Update an existing transaction
function updateTransaction(db, transactionData) {
  const transaction = {
    _id: transactionData._id,
    type: "transaction",
    state: "Active",
    ...transactionData,
    updatedAt: new Date().toISOString()
  };
  return db
    .put(transaction)
    .then((response) => ({
      success: true,
      transaction: { _id: response.id, ...transaction },
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Delete a transaction
async function archiveTransaction(db, transactionId) {
  try {
    // Get the transaction
    const transaction = await db.get(transactionId);

    // Get source and destination documents
    let sourceDoc, destDoc;
    
    if (transaction.source === 'account') {
      sourceDoc = await db.get(transaction.from);
    } else {
      const sourceResult = await db.find({
        selector: {
          _id: transaction.from,
          type: transaction.source
        }
      });
      sourceDoc = sourceResult.docs[0];
    }

    if (transaction.destination === 'account') {
      destDoc = await db.get(transaction.to);
    } else {
      const destResult = await db.find({
        selector: {
          _id: transaction.to,
          type: transaction.destination
        }
      });
      destDoc = destResult.docs[0];
    }

    if (!sourceDoc || !destDoc) {
      throw new Error('Source or destination not found');
    }

    // Handle currency conversions
    let sourceAmount = transaction.amount;
    let destAmount = transaction.amount;
    
    // Convert amounts based on currencies
    const sourceCurrency = sourceDoc.currency || 'KES';
    const destCurrency = destDoc.currency || 'KES';

    if (transaction.currency === 'KES') {
      if (sourceCurrency === 'USD' && destCurrency === 'KES') {
        sourceAmount = Math.floor(transaction.amount / transaction.rate);
      } else if (sourceCurrency === 'KES' && destCurrency === 'USD') {
        destAmount = Math.floor(transaction.amount / transaction.rate);
      } else if (sourceCurrency === 'USD' && destCurrency === 'USD') {
        sourceAmount = Math.floor(transaction.amount / transaction.rate);
        destAmount = Math.floor(transaction.amount / transaction.rate);
      }
    } else if (transaction.currency === 'USD') {
      if (sourceCurrency === 'KES' && destCurrency === 'KES') {
        sourceAmount = Math.floor(transaction.amount * transaction.rate);
        destAmount = Math.floor(transaction.amount * transaction.rate);
      } else if (sourceCurrency === 'KES' && destCurrency === 'USD') {
        sourceAmount = Math.floor(transaction.amount * transaction.rate);
      } else if (sourceCurrency === 'USD' && destCurrency === 'KES') {
        destAmount = Math.floor(transaction.amount * transaction.rate);
      }
    }

    // Reverse the transaction effects
    if (transaction.transType === 'withdraw') {
      if (transaction.destination === 'account') {
        sourceDoc.balance += sourceAmount;
        destDoc.balance -= destAmount;
      } else if (transaction.destination !== 'account') {
        sourceDoc.balance += sourceAmount;
        destDoc.balance += destAmount;
      }
    } else if (transaction.transType === 'deposit') {
      if (transaction.source === 'account') {
        sourceDoc.balance += sourceAmount;
        destDoc.balance -= destAmount;
      } else if (transaction.source !== 'account') {
        sourceDoc.balance -= sourceAmount;
        destDoc.balance -= destAmount;
      }
    }

    // Update documents in database
    await db.put(sourceDoc);
    await db.put(destDoc);

    // Archive the transaction
    transaction.state = "Inactive";
    transaction.updatedAt = new Date().toISOString();
    await db.put(transaction);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function searchCS(db, searchTerm, type, projectId) {
  try {
    const searchResult = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: "Active",
        type: type,
        projectId: projectId
      },
      limit: 100000
    });
    return { success: true, result: searchResult.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function transSearch(db, searchTerm, projectId) {
  try {
    const searchResult = await db.find({
      selector: {
        $or: [
          { description: { $regex: new RegExp(searchTerm, 'i') } },
          { fromName: { $regex: new RegExp(searchTerm, 'i') } },
          { toName: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: "Active",
        type: "transaction",
        projectId: projectId
      },
      limit: 100000
    });
    return { success: true, transactions: searchResult.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function filterTransactions(db, { projectId, filterData }) {
  try {
    const selector = {
      type: "transaction",
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

    // Add account name filter
    if (filterData.accountName) {
      selector.$or = [
        { fromName: filterData.accountName },
        { toName: filterData.accountName }
      ];
    }

    // Add transaction type filter
    if (filterData.transType) {
      selector.transType = filterData.transType;
    }

    // Add currency filter
    if (filterData.currency) {
      selector.currency = filterData.currency;
    }

    // Add amount range filter
    if (filterData.minAmount && filterData.maxAmount) {
      selector.amount = {
        $gte: filterData.minAmount,
        $lte: filterData.maxAmount
      };
    }

    const result = await db.find({
      selector,
      limit: 100000
    });

    return { success: true, transactions: result.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  archiveTransaction,
  searchCS,
  transSearch,
  filterTransactions
};
