const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit')
const fs = require('fs')
const { dialog } = require('electron')

// Create a new supplier record in the database
async function createSupplier(db, supplierData) {
  try {
    const supplier = {
      _id: uuidv4(),
      type: 'supplier',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...supplierData,
    };

    const response = await db.put(supplier);
    return {
      success: true,
      supplier: { _id: response.id, ...supplier }
    };
  } catch (error) {
    console.error('Supplier creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active suppliers from the database
async function getAllSuppliers(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'supplier',
        state: 'Active',
        projectId: projectId
      },
      limit: 100000
    });

    return { 
      success: true, 
      suppliers: result.docs 
    };
  } catch (error) {
    console.error('Fetching suppliers failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing supplier's information
async function updateSupplier(db, supplierData) {
  try {
    const existingSupplier = await db.get(supplierData._id);
    
    const supplier = {
      _id: supplierData._id,
      _rev: existingSupplier._rev,
      type: 'supplier',
      state: existingSupplier.state || 'Active',
      ...supplierData
    };

    const response = await db.put(supplier);
    return {
      success: true,
      supplier: { _id: response.id, ...supplier }
    };
  } catch (error) {
    console.error('Supplier update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a supplier as inactive (soft delete)
async function archiveSupplier(db, supplierId) {
  try {
    const supplier = await db.get(supplierId);
    supplier.state = 'Inactive';
    
    const response = await db.put(supplier);
    return { 
      success: true, 
      supplier: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Supplier archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search suppliers using flexible matching criteria
async function searchSuppliers(db, searchTerm, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'supplier'
      },
      limit: 100000
    });

    return {
      success: true,
      suppliers: result.docs
    };
  } catch (error) {
    console.error('Supplier search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve a specific supplier by their ID
async function getSupplierById(db, supplierId) {
  try {
    const supplier = await db.get(supplierId);
    
    // Only return active suppliers or provide a way to override
    if (supplier.type !== 'supplier' || supplier.state === 'Inactive') {
      return {
        success: false,
        error: 'Supplier not found or is inactive'
      };
    }

    return {
      success: true,
      supplier: supplier
    };
  } catch (error) {
    console.error('Fetching supplier by ID failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function getSupplierDetails(db, supplierId) {
  try {
    // Fetch supplier info
    const supplier = await db.get(supplierId);
    if (supplier.type !== 'supplier' || supplier.state === 'Inactive') {
      throw new Error('Supplier not found or is inactive');
    }

    // Fetch invoices
    const invoicesResult = await db.find({
      selector: {
        type: 'invoice',
        state: 'Active',
        supplierId: supplierId
      },
      limit: 100000
    });

    // Fetch transactions
    const transactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        $or: [
          { from: supplierId },
          { to: supplierId }
        ]
      },
      limit: 100000
    });

    // Prepare ledger entries
    let ledgerEntries = [
      // Convert invoices to ledger entries
      ...invoicesResult.docs.map(invoice => ({
        date: invoice.date,
        description: `Invoice: ${invoice.description}`,
        debit: invoice.amount,
        credit: 0,
        type: 'invoice',
        id: invoice._id,
        currency: invoice.currency,
        rate: invoice.rate
      })),
      // Convert transactions to ledger entries
      ...transactionsResult.docs.map(trans => ({
        date: trans.date,
        description: trans.description,
        debit: trans.from === supplierId ? trans.amount : 0,
        credit: trans.to === supplierId ? trans.amount : 0,
        type: 'transaction',
        id: trans._id,
        currency: trans.currency,
        rate: trans.rate
      }))
    ];

    // Sort by date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance and metrics
    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledgerWithBalance = ledgerEntries.map(entry => {
      // Convert to KES for totals if currency is USD
      const debitInKES = entry.currency === 'USD' ? entry.debit * entry.rate : entry.debit;
      const creditInKES = entry.currency === 'USD' ? entry.credit * entry.rate : entry.credit;
      
      totalDebit += debitInKES;
      totalCredit += creditInKES;
      balance = balance + debitInKES - creditInKES;
      
      return {
        ...entry,
        balance: balance
      };
    });

    return {
      success: true,
      data: {
        info: supplier,
        metrics: {
          totalDebit,
          totalCredit,
          difference: totalDebit - totalCredit
        },
        ledger: ledgerWithBalance
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function supplierPDF(args) {
  try {
    const { data, supplier, totals } = args

    // Helper function to format money
    const formatMoney = (amount) => {
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `supplier_${supplier}_ledger.pdf`,
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (!filePath) return { success: false, error: 'Export cancelled' }

    // Create PDF with A4 size and smaller margins
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40
    })
    const stream = fs.createWriteStream(filePath)
    doc.pipe(stream)

    // Header Section
    doc.rect(0, 0, doc.page.width, 60)
       .fill('#0078d7')

    doc.fillColor('#ffffff')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text('Supplier Ledger', 0, 15, {
         align: 'center'
       })

    // Subheader with supplier name
    doc.moveDown(0.5)
    doc.fontSize(10)
       .text(`Supplier: ${supplier}`, {
         align: 'center'
       })

    // Bullet point list for totals
    doc.moveDown(0.5)
    const summaryTop = doc.y
    doc.fontSize(10)
       .fillColor('#0078d7')
       .text(`• Total Debit: ${formatMoney(totals.totalDebit)}`, 40, summaryTop)
       
    doc.fillColor('#000000')
       .fontSize(10)
       .text(`• Total Credit: ${formatMoney(totals.totalCredit)}`, 40, doc.y + 5)
       .text(`• Balance: ${formatMoney(totals.difference)}`, 40, doc.y + 5)

    // Table configuration remains the same
    const tableTop = summaryTop + 60
    const tableLeft = 40
    const columnWidths = [60, 170, 60, 60, 60]
    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance']

    // Draw table header background
    doc.rect(tableLeft, tableTop, columnWidths.reduce((a, b) => a + b, 0), 15)
       .fill('#f0f0f0')
    doc.fillColor('#000000')
       .fontSize(8)
       .font('Helvetica-Bold')

    let x = tableLeft
    headers.forEach((header, i) => {
      doc.text(header, x + 3, tableTop + 3, {
        width: columnWidths[i] - 6,
        align: 'left'
      })
      x += columnWidths[i]
    })

    // Draw a line below the header
    doc.moveTo(tableLeft, tableTop + 15)
       .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), tableTop + 15)
       .strokeColor('#0078d7')
       .lineWidth(0.5)
       .stroke()

    // Table rows with smaller font and auto-wrapping for long descriptions
    doc.font('Helvetica')
       .fontSize(8)
    let yPosition = tableTop + 20

    data.forEach((entry) => {
      // Build cell contents
      const cellContents = [
        new Date(entry.date).toLocaleDateString(),
        entry.description,
        entry.debit ? formatMoney(entry.debit) : '-',
        entry.credit ? formatMoney(entry.credit) : '-',
        formatMoney(entry.balance)
      ]

      // Calculate the maximum height needed for the row by checking each cell
      const cellHeights = cellContents.map((cell, i) => {
        return doc.heightOfString(cell, { width: columnWidths[i] - 6, align: 'left' })
      })
      const rowHeight = Math.max(...cellHeights, 12)

      // If the row extends beyond the page height, add a new page and redraw header
      if (yPosition + rowHeight > doc.page.height - 40) {
        doc.addPage()
        yPosition = 40
        // Redraw table header on new page
        doc.rect(tableLeft, yPosition, columnWidths.reduce((a, b) => a + b, 0), 15)
           .fill('#f0f0f0')
        doc.fillColor('#000000')
           .fontSize(8)
           .font('Helvetica-Bold')
        x = tableLeft
        headers.forEach((header, i) => {
          doc.text(header, x + 3, yPosition + 3, {
            width: columnWidths[i] - 6,
            align: 'left'
          })
          x += columnWidths[i]
        })
        doc.moveTo(tableLeft, yPosition + 15)
           .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), yPosition + 15)
           .strokeColor('#0078d7')
           .lineWidth(0.5)
           .stroke()
        yPosition += 20
      }

      // Write each cell with wrapping and auto-adjust height
      x = tableLeft
      cellContents.forEach((cell, i) => {
        doc.fillColor('#000000')
           .font('Helvetica')
           .fontSize(8)
           .text(cell, x + 3, yPosition, {
             width: columnWidths[i] - 6,
             align: 'left'
           })
        x += columnWidths[i]
      })

      yPosition += rowHeight + 5
      
      // Optional: draw a light line between rows
      doc.moveTo(tableLeft, yPosition - 2)
         .lineTo(tableLeft + columnWidths.reduce((a, b) => a + b, 0), yPosition - 2)
         .strokeColor('#e0e0e0')
         .lineWidth(0.5)
         .stroke()
    })

    doc.end()
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

module.exports = {
  createSupplier,
  getAllSuppliers,
  updateSupplier,
  archiveSupplier,
  searchSuppliers,
  getSupplierById,
  getSupplierDetails,
  supplierPDF
};
