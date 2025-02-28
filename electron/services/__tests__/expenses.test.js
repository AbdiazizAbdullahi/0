const {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  archiveExpense,
  getExpenseStats
} = require('../expenses');

const mockDb = {
  get: jest.fn(),
  put: jest.fn(),
  find: jest.fn()
};

describe('Expense Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExpense', () => {
    const expenseData = {
      description: 'Test expense',
      amount: 1000,
      date: '2023-01-01',
      accountId: 'account1',
      accountName: 'Test Account',
      expenseType: 'General',
      currency: 'USD',
      rate: 145,
      projectId: 'project1'
    };

    it('should create an expense with account balance update', async () => {
      mockDb.get.mockResolvedValue({ 
        currency: 'KES',
        balance: 150000
      });
      mockDb.put.mockResolvedValue({ id: 'newId' });

      const result = await createExpense(mockDb, expenseData);
      expect(result.success).toBe(true);
      expect(result.expense).toBeDefined();
      expect(mockDb.put).toHaveBeenCalledTimes(2);
    });
  });

  describe('getExpenseStats', () => {
    it('should calculate expense statistics correctly', async () => {
      const mockExpenses = [
        { _id: '1', amount: 1000, currency: 'USD', rate: 145, date: '2023-01-01' },
        { _id: '2', amount: 2000, currency: 'KES', rate: 1, date: '2023-12-01' }
      ];
      
      mockDb.find.mockResolvedValue({ docs: mockExpenses });

      const result = await getExpenseStats(mockDb, 'project1');
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalExpenses).toBeDefined();
      expect(result.stats.lastMonthExpenses).toBeDefined();
    });
  });

  // Add more test cases for other methods...
});
