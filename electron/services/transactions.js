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

    // Validate balance for withdrawals
    // if (transactionData.transType === 'withdraw' && sourceDoc.balance < transactionData.amount) {
    //   throw new Error('Insufficient balance in source account');
    // }

    // if (transactionData.transType === 'deposit' && transactionData.source === 'account' && sourceDoc.balance < transactionData.amount) {
    //   throw new Error('Insufficient balance in source account');
    // }

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

    // if (sourceCurrency !== destCurrency) {
    //   if (sourceCurrency === 'USD' && destCurrency === 'KES') {
    //   // Convert USD to KES and round down
    //   destAmount = Math.floor(transactionData.amount * transactionData.rate);
    //   } else if (sourceCurrency === 'KES' && destCurrency === 'USD') {
    //   // Convert KES to USD and round down
    //   destAmount = Math.floor(transactionData.amount / transactionData.rate);
    //   }
    // }

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
function archiveTransaction(db, transactionId) {
  return db
    .get(transactionId)
    .then((transaction) => {
      transaction.state = "Inactive";
      transaction.updatedAt = new Date().toISOString();
      return db.put(transaction);
    })
    .then(() => ({ success: true }))
    .catch((error) => ({ success: false, error: error.message }));
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

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  archiveTransaction,
  searchCS,
  transSearch,
};
