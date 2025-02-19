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
    createdAt: new Date().toISOString(),
    type: "invoice",
    state: "Active",
  };
  
  return db
    .get(invoiceData.supplierId)
    .then((supplier) => {
      // Update supplier's balance
      supplier.balance = (supplier.balance || 0) + parseInt(invoiceData.amount);
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
function archiveInvoice(db, invoiceId) {
  return db
    .get(invoiceId)
    .then((invoice) => {
      // Update the state field to "Inactive"
      invoice.state = "Inactive";
      return db.put(invoice);
    })
    .then(() => ({ success: true }))
    .catch((error) => ({ success: false, error: error.message }));
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