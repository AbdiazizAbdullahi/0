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

function setupIpcHandlers(ipcMain, db, mainWindow) {
    ipcMain.handle('search-cs', async (event, searchTerm, type) => {
        return transactions.searchCS(db, searchTerm, type);
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
                return suppliers.getAllSuppliers(db);
            case 'updateSupplier':
                return suppliers.updateSupplier(db, args[0]);
            case 'archiveSupplier':
                return suppliers.archiveSupplier(db, args[0]);
            case 'searchSuppliers':
                return suppliers.searchSuppliers(db, args[0]);
            case 'getSupplierById':
                return suppliers.getSupplierById(db, args[0]);

            // Agents
            case 'createAgent':
                return agents.createAgent(db, args[0]);
            case 'getAllAgents':
                return agents.getAllAgents(db);
            case 'updateAgent':
                return agents.updateAgent(db, args[0]);
            case 'archiveAgent':
                return agents.archiveAgent(db, args[0]);
            case 'searchAgents':
                return agents.searchAgents(db, args[0]);

            // Clients
            case 'createClient':
                return clients.createClient(db, args[0]);
            case 'getAllClients':
                return clients.getAllClients(db);
            case 'updateClient':
                return clients.updateClient(db, args[0]);
            case 'archiveClient':
                return clients.archiveClient(db, args[0]);
            case 'searchClients':
                return clients.searchClients(db, args[0]);

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
                return sales.getAllSales(db);
            case 'updateSale':
                return sales.updateSale(db, args[0]);
            case 'archiveSale':
                return sales.archiveSale(db, args[0]);
            case 'searchSales':
                return sales.searchSales(db, args[0]);

            // Staff
            case 'createStaff':
                return staff.createStaff(db, args[0]);
            case 'getAllStaff':
                return staff.getAllStaff(db);
            case 'updateStaff':
                return staff.updateStaff(db, args[0]);
            case 'archiveStaff':
                return staff.archiveStaff(db, args[0]);
            case 'searchStaff':
                return staff.searchStaff(db, args[0]);
            case 'getStaffById':
                return staff.getStaffById(db, args[0]);

            // Accounts
            case 'createAccount':
                return accounts.createAccount(db, args[0]);
            case 'getAllAccounts':
                return accounts.getAllAccounts(db);
            case 'getAccountById':
                return accounts.getAccountById(db, args[0]);
            case 'updateAccount':
                return accounts.updateAccount(db, args[0]);
            case 'archiveAccount':
                return accounts.archiveAccount(db, args[0]);

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
            case 'searchTransactions':
                return transactions.searchTransactions(db, args[0], args[1]);
            case 'getTodayTransactions':
                return transactions.getTodayTransactions(db);

            // Expenses
            case 'createExpense':
                return expenses.createExpense(db, args[0]);
            case 'getAllExpenses':
                return expenses.getAllExpenses(db);
            case 'getExpenseById':
                return expenses.getExpenseById(db, args[0]);
            case 'updateExpense':
                return expenses.updateExpense(db, args[0]);
            case 'archiveExpense':
                return expenses.archiveExpense(db, args[0]);

            // Invoices
            case 'createInvoice':
                return invoices.createInvoice(db, args[0]);
            case 'getAllInvoices':
                return invoices.getAllInvoices(db);
            case 'getInvoiceById':
                return invoices.getInvoiceById(db, args[0]);
            case 'updateInvoice':
                return invoices.updateInvoice(db, args[0]);
            case 'archiveInvoice':
                return invoices.archiveInvoice(db, args[0]);

            default:
                throw new Error(`Unknown operation: ${operation}`);
        }
    })
}

module.exports = setupIpcHandlers;
