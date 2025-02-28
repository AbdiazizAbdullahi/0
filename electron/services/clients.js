const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit')
const fs = require('fs')
const { dialog } = require('electron')

// Create a new client record in the database
async function createClient(db, clientData) {
  try {
    const client = {
      _id: uuidv4(),
      type: 'client',
      state: 'Active',
      createdAt: new Date().toISOString(),
      currency: clientData.currency || 'KES',
      ...clientData,
    };

    const response = await db.put(client);
    return {
      success: true,
      client: { _id: response.id, ...client }
    };
  } catch (error) {
    console.error('Client creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active clients from the database
async function getAllClients(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'client',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      clients: result.docs 
    };
  } catch (error) {
    console.error('Fetching clients failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing client's information
async function updateClient(db, clientData) {
  try {
    const existingClient = await db.get(clientData._id);
    
    const client = {
      _id: clientData._id,
      _rev: existingClient._rev,
      type: 'client',
      state: existingClient.state || 'Active',
      ...clientData
    };

    const response = await db.put(client);
    return {
      success: true,
      client: { _id: response.id, ...client }
    };
  } catch (error) {
    console.error('Client update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a client as inactive (soft delete)
async function archiveClient(db, clientId) {
  try {
    const client = await db.get(clientId);
    client.state = 'Inactive';
    
    const response = await db.put(client);
    return { 
      success: true, 
      client: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Client archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search clients using flexible matching criteria
async function searchClients(db, searchTerm, projectId, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'client',
        projectId: projectId
      }
    });

    return {
      success: true,
      clients: result.docs
    };
  } catch (error) {
    console.error('Client search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function getClientDetails(db, clientId) {
  try {
    // Fetch client info
    const client = await db.get(clientId);
    if (client.type !== 'client' || client.state === 'Inactive') {
      throw new Error('Client not found or is inactive');
    }

    // Fetch sales
    const salesResult = await db.find({
      selector: {
        type: 'sale',
        state: 'Active',
        clientId: clientId
      }
    });

    // Fetch transactions
    const transactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        $or: [
          { from: clientId },
          { to: clientId }
        ]
      }
    });

    // Prepare ledger entries
    let ledgerEntries = [
      // Convert sales to ledger entries
      ...salesResult.docs.map(sale => ({
        date: sale.date,
        description: `Sale for ${sale.houseNo}`,
        debit: 0,
        credit: sale.price,
        type: 'sale',
        id: sale._id
      })),
      // Convert transactions to ledger entries
      ...transactionsResult.docs.map(trans => ({
        date: trans.date,
        description: trans.description,
        debit: trans.from === clientId ? trans.amount : 0,
        credit: trans.to === clientId ? trans.amount : 0,
        type: 'transaction',
        id: trans._id
      }))
    ];

    // Sort by date and calculate balances
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledgerWithBalance = ledgerEntries.map(entry => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
      balance = balance + entry.debit - entry.credit;
      return {
        ...entry,
        balance
      };
    });

    return {
      success: true,
      data: {
        info: client,
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

async function clientPDF(args) {
  try {
    const { data, client, totals } = args;
    
    // Helper function to format money
    const formatMoney = (amount) => {
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `client_${client}_ledger.pdf`,
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
       .text('Client Ledger', 0, 15, {
         align: 'center'
       })

    // Subheader with client name
    doc.moveDown(0.5)
    doc.fontSize(10)
       .text(`Client: ${client}`, {
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

    // Table configuration
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

    // Table rows
    doc.font('Helvetica')
       .fontSize(8)
    let yPosition = tableTop + 20

    data.forEach((entry) => {
      // Calculate row content and height
      const cellContents = [
        new Date(entry.date).toLocaleDateString(),
        entry.description,
        entry.debit ? formatMoney(entry.debit) : '-',
        entry.credit ? formatMoney(entry.credit) : '-',
        formatMoney(entry.balance)
      ]

      const cellHeights = cellContents.map((cell, i) => {
        return doc.heightOfString(cell, { width: columnWidths[i] - 6, align: 'left' })
      })
      const rowHeight = Math.max(...cellHeights, 12)

      // Add new page if needed
      if (yPosition + rowHeight > doc.page.height - 40) {
        doc.addPage()
        yPosition = 40
        // Redraw header on new page
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

      // Write row contents
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
      
      // Draw row separator
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
  createClient,
  getAllClients,
  updateClient,
  archiveClient,
  searchClients,
  getClientDetails,
  clientPDF
};
