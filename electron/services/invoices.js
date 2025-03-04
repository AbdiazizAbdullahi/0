const { v4: uuidv4 } = require('uuid');

// Create a new invoice
function createInvoice(db, invoiceData) {
  const invoice = {
    _id: uuidv4(),
    description: invoiceData.description,
    amount: parseInt(invoiceData.amount, 10),
    date: new Date(invoiceData.date).toISOString(),
    projectId: invoiceData.projectId,
    supplierId: invoiceData.supplierId,
    supplierName: invoiceData.supplierName,
    invoiceNumber: invoiceData.invoiceNumber || '',
    quantity: invoiceData.quantity || '',
    price: invoiceData.price || '',
    currency: invoiceData.currency || 'KES',
    rate: invoiceData.rate || 1,
    createdAt: new Date().toISOString(),
    type: "invoice",
    state: "Active",
  };
  
  return db
    .get(invoiceData.supplierId)
    .then((supplier) => {
      // Convert amount if currencies are different
      let convertedAmount = invoice.amount;
      if (supplier.currency === 'USD' && invoiceData.currency === 'KES') {
        convertedAmount = Math.floor(invoice.amount / invoice.rate);
      } else if (supplier.currency === 'KES' && invoiceData.currency === 'USD') {
        convertedAmount = Math.floor(invoice.amount * invoice.rate);
      }
      
      // Update supplier's balance with converted amount
      supplier.balance = (supplier.balance || 0) + convertedAmount;
      return db.put(supplier);
    })
    .then(() => {
      // Create the invoice
      return db.put(invoice);
    })
    .then((response) => ({
      success: true,
      invoice: { _id: response.id, ...invoice }
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Get all invoices
function getAllInvoices(db, projectId) {
  return db
    .find({
      selector: { 
        type: "invoice",
        state: "Active",
        projectId: projectId
      },
      limit: 100000
    })
    .then((result) => ({ success: true, invoices: result.docs }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Get an invoice by ID
function getInvoiceById(db, invoiceId) {
  return db
    .get(invoiceId)
    .then((invoice) => ({ success: true, invoice }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Update an existing invoice
function updateInvoice(db, invoiceData) {
  const invoice = {
    _id: invoiceData._id,
    type: "invoice",
    state: "Active",
    ...invoiceData,
    updatedAt: new Date().toISOString()
  };
  
  return db
    .put(invoice)
    .then((response) => ({
      success: true,
      invoice: { _id: response.id, ...invoice },
    }))
    .catch((error) => ({ success: false, error: error.message }));
}

// Archive an invoice
async function archiveInvoice(db, invoiceId) {
  try {
    const invoice = await db.get(invoiceId);
    const supplier = await db.get(invoice.supplierId);

    // Convert amount if currencies are different
    let deductAmount = invoice.amount;
    if (supplier.currency === 'USD' && invoice.currency === 'KES') {
      deductAmount = Math.floor(invoice.amount / invoice.rate);
    } else if (supplier.currency === 'KES' && invoice.currency === 'USD') {
      deductAmount = Math.floor(invoice.amount * invoice.rate);
    }

    // Reverse the supplier's balance
    supplier.balance = (supplier.balance || 0) - deductAmount;
    await db.put(supplier);

    // Archive the invoice
    invoice.state = "Inactive";
    invoice.updatedAt = new Date().toISOString();
    await db.put(invoice);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function invoiceSearch(db, searchTerm, projectId) {
  try {
    const searchResult = await db.find({
      selector: {
        $or: [
          { description: { $regex: new RegExp(searchTerm, 'i') } },
          { supplierName: { $regex: new RegExp(searchTerm, 'i') } },
          { invoiceNumber: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: "Active",
        type: "invoice",
        projectId: projectId
      },
      limit: 100000
    });
    return { success: true, invoices: searchResult.docs };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  archiveInvoice,
  invoiceSearch,
};