const { 
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  archiveTransaction
} = require('../transactions');

// Mock PouchDB
const mockDb = {
  get: jest.fn(),
  put: jest.fn(),
  find: jest.fn()
};

describe('Transaction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const transactionData = {
      from: 'account1',
      to: 'account2',
      fromName: 'Source Account',
      toName: 'Destination Account',
      amount: 1000,
      currency: 'KES',
      rate: 145,
      description: 'Test transaction',
      source: 'account',
      destination: 'account',
      transType: 'withdraw',
      projectId: 'project1',
      date: '2023-01-01'
    };

    it('should create a transaction successfully', async () => {
      mockDb.get.mockResolvedValueOnce({ balance: 2000 });
      mockDb.get.mockResolvedValueOnce({ balance: 1000 });
      mockDb.put.mockResolvedValue({ id: 'newId' });

      const result = await createTransaction(mockDb, transactionData);
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(mockDb.put).toHaveBeenCalledTimes(3);
    });

    it('should fail if source has insufficient balance', async () => {
      mockDb.get.mockResolvedValueOnce({ balance: 500 });
      mockDb.get.mockResolvedValueOnce({ balance: 1000 });

      const result = await createTransaction(mockDb, transactionData);
      expect(result.success).toBe(false);
    });
  });

  describe('getAllTransactions', () => {
    it('should return all active transactions', async () => {
      const mockTransactions = [
        { _id: '1', amount: 1000 },
        { _id: '2', amount: 2000 }
      ];
      
      mockDb.find.mockResolvedValue({ docs: mockTransactions });

      const result = await getAllTransactions(mockDb, 'project1');
      expect(result.success).toBe(true);
      expect(result.transactions).toEqual(mockTransactions);
    });
  });

  describe('getTransactionById', () => {
    it('should return a specific transaction', async () => {
      const mockTransaction = { 
        _id: '1',
        from: 'acc1',
        to: 'acc2',
        amount: 1000
      };
      
      mockDb.get.mockResolvedValueOnce(mockTransaction);
      mockDb.get.mockResolvedValueOnce({ name: 'Source' });
      mockDb.get.mockResolvedValueOnce({ name: 'Destination' });

      const result = await getTransactionById(mockDb, '1');
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
    });
  });

  // Add more test cases for updateTransaction and archiveTransaction...
});
