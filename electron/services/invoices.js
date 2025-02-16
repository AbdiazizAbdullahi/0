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
    invoiceNumber: invoiceData.invoiceNumber,
    quantity: invoiceData.quantity,
    price: invoiceData.price,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    type: "invoice",
    state: "Active",
    status: invoiceData.status || "Pending"
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
function getAllInvoices(db) {
  return db
    .find({
      selector: { 
        type: "invoice",
        state: "Active"
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

module.exports = {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  archiveInvoice,
};