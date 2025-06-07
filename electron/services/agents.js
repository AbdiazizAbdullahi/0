const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit')
const fs = require('fs')
const { dialog } = require('electron')

// Create a new agent record in the database
async function createAgent(db, agentData) {
  try {
    const agent = {
      _id: uuidv4(),
      type: 'agent',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...agentData,
    };

    const response = await db.put(agent);
    return {
      success: true,
      agent: { _id: response.id, ...agent }
    };
  } catch (error) {
    console.error('Agent creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active agents from the database
async function getAllAgents(db, projectId) {
  try {
    const result = await db.find({
      selector: { 
        type: 'agent',
        state: 'Active',
        projectId: projectId
      }
    });

    return { 
      success: true, 
      agents: result.docs 
    };
  } catch (error) {
    console.error('Fetching agents failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing agent's information
async function updateAgent(db, agentData) {
  try {
    const existingAgent = await db.get(agentData._id);
    
    const agent = {
      _id: agentData._id,
      _rev: existingAgent._rev,
      type: 'agent',
      state: existingAgent.state || 'Active',
      ...agentData
    };

    const response = await db.put(agent);
    return {
      success: true,
      agent: { _id: response.id, ...agent }
    };
  } catch (error) {
    console.error('Agent update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark an agent as inactive (soft delete)
async function archiveAgent(db, agentId) {
  try {
    const agent = await db.get(agentId);
    agent.state = 'Inactive';
    
    const response = await db.put(agent);
    return { 
      success: true, 
      agent: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Agent archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search agents using flexible matching criteria
async function searchAgents(db, searchTerm, projectId, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { phoneNumber: { $regex: new RegExp(searchTerm, 'i') } },
          { email: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'agent',
        projectId: projectId
      }
    });

    return {
      success: true,
      agents: result.docs
    };
  } catch (error) {
    console.error('Agent search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function getAgentDetails(db, agentId) {
  try {
    // Fetch agent info
    const agent = await db.get(agentId);
    if (agent.type !== 'agent' || agent.state === 'Inactive') {
      throw new Error('Agent not found or is inactive');
    }

    // Fetch sales associated with this agent
    const salesResult = await db.find({
      selector: {
        type: 'sale',
        state: 'Active',
        agentId: agentId
      },
      limit: 10000
    });

    // Fetch commission transactions
    const agentTransactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        $or: [
          { from: agentId },
          { to: agentId }
        ]
      },
      limit: 10000
    });

    // Fetch client transactions for all sales
    const clientTransactions = [];
    for (const sale of salesResult.docs) {
      if (sale.clientId) {
        const clientTransactionsResult = await db.find({
          selector: {
            type: 'transaction',
            state: 'Active',
            $or: [
              { from: sale.clientId },
              { to: sale.clientId }
            ]
          }
        });
        clientTransactions.push(...clientTransactionsResult.docs);
      }
    }

    // Prepare ledger entries
    let ledgerEntries = [
      // Add sales as credit entries
      ...salesResult.docs.map(sale => ({
        date: sale.date,
        description: `Sale: ${sale.houseNo}`,
        debit: 0,
        credit: sale.price || 0,
        type: 'sale',
        id: sale._id,
        currency: sale.currency || 'KES',
        rate: sale.rate || 1
      })),
      // Convert sales commissions to ledger entries
      ...salesResult.docs.map(sale => ({
        date: sale.date,
        description: `Commission for ${sale.houseNo}`,
        debit: sale.commission,
        credit: 0,
        type: 'commission',
        id: sale._id,
        currency: sale.currency || 'KES',
        rate: sale.rate || 1
      })),
      // Convert agent transactions to ledger entries
      ...agentTransactionsResult.docs.map(trans => ({
        date: trans.date,
        description: trans.description,
        debit: trans.from === agentId ? trans.amount : 0,
        credit: trans.to === agentId ? trans.amount : 0,
        type: 'transaction',
        id: trans._id,
        currency: trans.currency || 'KES',
        rate: trans.rate || 1
      })),
      // Convert client transactions to ledger entries
      ...clientTransactions.map(trans => ({
        date: trans.date,
        description: `Client: ${trans.description}`,
        debit: trans.amount,
        credit: 0,
        type: 'clientTransaction',
        id: trans._id,
        currency: trans.currency || 'KES',
        rate: trans.rate || 1
      }))
    ];

    // Sort by date
    ledgerEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    let totalCommissions = 0;

    // Calculate total commissions directly from sales results
    console.log(`Calculating totalCommissions for agentId: ${agentId}`); // Log agentId
    salesResult.docs.forEach(sale => {
      const commissionAmount = sale.commission || 0;
      const commissionInKES = sale.currency === 'USD' && sale.rate ? Number(commissionAmount) * sale.rate : Number(commissionAmount);
      totalCommissions += commissionInKES;
    });

    const ledgerWithBalance = ledgerEntries.map(entry => {
      const debitInKES = entry.currency === 'USD' ? Number(entry.debit) * entry.rate : Number(entry.debit);
      const creditInKES = entry.currency === 'USD' ? Number(entry.credit) * entry.rate : Number(entry.credit);
      
      totalDebit += debitInKES;
      totalCredit += creditInKES;
      balance = Number(balance) + debitInKES - creditInKES;
      
      return {
        ...entry,
        balance
      };
    });

    return {
      success: true,
      data: {
        info: agent,
        metrics: {
          totalDebit,
          totalCredit,
          totalCommissions,
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

async function agentPDF(args) {
  try {
    const { data, agent, totals } = args;
    
    // Helper function to format money
    const formatMoney = (amount) => {
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `agent_${agent}_ledger.pdf`,
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
       .text('Agent Ledger', 0, 15, {
         align: 'center'
       })

    // Subheader with agent name
    doc.moveDown(0.5)
    doc.fontSize(10)
       .text(`Agent: ${agent}`, {
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
  createAgent,
  getAllAgents,
  updateAgent,
  archiveAgent,
  searchAgents,
  getAgentDetails,
  agentPDF
};
