const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { dialog } = require('electron');

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

// Get account details with ledger
async function getAccountDetails(db, accountId) {
  try {
    // Fetch account info
    const account = await db.get(accountId);
    if (account.type !== 'account' || account.state === 'Inactive') {
      throw new Error('Account not found or is inactive');
    }

    // Fetch transactions related to this account
    const transactionsResult = await db.find({
      selector: {
        type: 'transaction',
        state: 'Active',
        $or: [
          { from: accountId },
          { to: accountId }
        ]
      }
    });

    // Prepare ledger entries from transactions
    let ledgerEntries = transactionsResult.docs.map(trans => ({
      date: trans.date,
      description: trans.description,
      debit: trans.to === accountId ? trans.amount : 0,
      credit: trans.from === accountId ? trans.amount : 0,
      type: 'transaction',
      id: trans._id,
      currency: trans.currency,
      rate: trans.rate || 1
    }));

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
        info: account,
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

async function accountPDF(args) {
  try {
    const { data, account, totals } = args

    // Helper function to format money
    const formatMoney = (amount) => {
      return amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Ask user where to save the file
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: `account_${account}_ledger.pdf`,
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
       .text('Account Ledger', 0, 15, {
         align: 'center'
       })

    // Subheader with account name
    doc.moveDown(0.5)
    doc.fontSize(10)
       .text(`Account: ${account}`, {
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
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  archiveAccount,
  getAccountTotals,
  getAccountDetails,
  accountPDF
};
