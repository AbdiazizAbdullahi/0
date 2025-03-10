const suppliers = require('./services/suppliers')
const agents = require('./services/agents')
const clients = require('./services/clients')
const projects = require('./services/projects')
const sales = require('./services/sales')
const staff = require('./services/staff')
const bulk = require('./services/bulkLoading')
const accounts = require('./services/accounts')
const transactions = require('./services/transactions')
const expenses = require('./services/expenses')
const invoices = require('./services/invoices')
const auth = require('./services/login')

function setupIpcHandlers(ipcMain, db, mainWindow) {
    ipcMain.handle('search-cs', async (event, searchTerm, type, projectId) => {
      return transactions.searchCS(db, searchTerm, type, projectId);
    });

    ipcMain.handle('trans-search', async (event, searchTerm, projectId) => {
      return transactions.transSearch(db, searchTerm, projectId);
    });

    ipcMain.handle('invoice-search', async (event, searchTerm, projectId) => {
      return invoices.invoiceSearch(db, searchTerm, projectId);
    });

    ipcMain.handle('expense-search', async (event, searchTerm, projectId) => {
      return expenses.expenseSearch(db, searchTerm, projectId);
    });

    ipcMain.handle('sales-search', async (event, searchTerm, projectId) => {
      return sales.salesSearch(db, searchTerm, projectId);
    });

    ipcMain.handle('login', async (event, phone, passcode) => {
      return auth.loginStaff(db, phone, passcode);
    });

    ipcMain.handle('main-operation', async (event, operation, ...args) => {
        switch (operation) {
            // Bulk Loading Data
            case 'bulkCreateClients':
                return bulk.bulkCreateClients(db, args[0]);
            case 'bulkCreateInvoices':
                return bulk.bulkCreateInvoices(db, args[0]);
            case 'bulkCreateTransactions':
                return bulk.bulkCreateTransactions(db, args[0]);
            case 'bulkCreateExpenses':
                return bulk.bulkCreateExpenses(db, args[0]);

            // Suppliers
            case 'createSupplier':
                return suppliers.createSupplier(db, args[0]);
            case 'getAllSuppliers':
                return suppliers.getAllSuppliers(db, args[0]); // args[0]: projectId
            case 'updateSupplier':
                return suppliers.updateSupplier(db, args[0]);
            case 'archiveSupplier':
                return suppliers.archiveSupplier(db, args[0]);
            case 'searchSuppliers':
                return suppliers.searchSuppliers(db, args[0]); // add projectId in function if updated
            case 'getSupplierById':
                return suppliers.getSupplierById(db, args[0]);
            case 'getSupplierDetails':
                return suppliers.getSupplierDetails(db, args[0]);
            case 'supplierPDF':
                return suppliers.supplierPDF(args[0]);

            // Agents
            case 'createAgent':
                return agents.createAgent(db, args[0]);
            case 'getAllAgents':
                return agents.getAllAgents(db, args[0]); // args[0]: projectId
            case 'updateAgent':
                return agents.updateAgent(db, args[0]);
            case 'archiveAgent':
                return agents.archiveAgent(db, args[0]);
            case 'searchAgents':
                return agents.searchAgents(db, args[0]); // expect projectId included in function, adjust accordingly
            case 'getAgentDetails':
                return agents.getAgentDetails(db, args[0]);
            case 'agentPDF':
                return agents.agentPDF(args[0]);

            // Clients
            case 'createClient':
                return clients.createClient(db, args[0]);
            case 'getAllClients':
                return clients.getAllClients(db, args[0]); // args[0]: projectId
            case 'updateClient':
                return clients.updateClient(db, args[0]);
            case 'archiveClient':
                return clients.archiveClient(db, args[0]);
            case 'searchClients':
                return clients.searchClients(db, args[0]); // expect projectId
            case 'getClientDetails':
                return clients.getClientDetails(db, args[0]);
            case 'clientPDF':
                return clients.clientPDF(args[0]);

            // Projects
            case 'createProject':
                return projects.createProject(db, args[0]);
            case 'getAllProjects':
                return projects.getAllProjects(db);
            case 'updateProject':
                return projects.updateProject(db, args[0]);
            case 'archiveProject':
                return projects.archiveProject(db, args[0]);
            case 'searchProjects':
                return projects.searchProjects(db, args[0]);
            case 'getProjectById':
                return projects.getProjectById(db, args[0]);

            // Sales
            case 'createSale':
                return sales.createSale(db, args[0]);
            case 'getAllSales':
                return sales.getAllSales(db, args[0]); // args[0]: projectId
            case 'updateSale':
                return sales.updateSale(db, args[0]);
            case 'archiveSale':
                return sales.archiveSale(db, args[0]);
            case 'searchSales':
                return sales.searchSales(db, args[0]); // args[0]: projectId

            // Staff
            case 'createStaff':
                return staff.createStaff(db, args[0]);
            case 'getAllStaff':
                return staff.getAllStaff(db, args[0]); // args[0]: projectId
            case 'updateStaff':
                return staff.updateStaff(db, args[0]);
            case 'archiveStaff':
                return staff.archiveStaff(db, args[0]);
            case 'searchStaff':
                return staff.searchStaff(db, args[0]); // args[0]: projectId
            case 'getStaffById':
                return staff.getStaffById(db, args[0]);

            // Accounts
            case 'createAccount':
                return accounts.createAccount(db, args[0]);
            case 'getAllAccounts':
                return accounts.getAllAccounts(db, args[0]); // args[0]: projectId
            case 'getAccountById':
                return accounts.getAccountById(db, args[0]);
            case 'updateAccount':
                return accounts.updateAccount(db, args[0]);
            case 'archiveAccount':
                return accounts.archiveAccount(db, args[0]);
            case 'getAccountTotals':
                return accounts.getAccountTotals(db, args[0]);

            // Transactions
            case 'createTransaction':
                return transactions.createTransaction(db, args[0]);
            case 'getAllTransactions':
                return transactions.getAllTransactions(db, args[0]);
            case 'getTransactionById':
                return transactions.getTransactionById(db, args[0]);
            case 'updateTransaction':
                return transactions.updateTransaction(db, args[0]);
            case 'archiveTransaction':
                return transactions.archiveTransaction(db, args[0]);

            // Expenses
            case 'createExpense':
                return expenses.createExpense(db, args[0]);
            case 'getAllExpenses':
                return expenses.getAllExpenses(db, args[0]); // args[0]: projectId
            case 'getExpenseById':
                return expenses.getExpenseById(db, args[0]);
            case 'updateExpense':
                return expenses.updateExpense(db, args[0]);
            case 'archiveExpense':
                return expenses.archiveExpense(db, args[0]);
            case 'filterExpenses':
                return await expenses.filterExpenses(db, args[0], args[1]);
            case 'getExpenseStats':
                return await expenses.getExpenseStats(db, args[0]);

            // Invoices
            case 'createInvoice':
                return invoices.createInvoice(db, args[0]);
            case 'getAllInvoices':
                return invoices.getAllInvoices(db, args[0]); // already updated
            case 'getInvoiceById':
                return invoices.getInvoiceById(db, args[0]);
            case 'updateInvoice':
                return invoices.updateInvoice(db, args[0]);
            case 'archiveInvoice':
                return invoices.archiveInvoice(db, args[0]);

            case 'seedAdminIfNeeded':
                return auth.seedAdminIfNeeded(db);

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    })
}

module.exports = setupIpcHandlers;
