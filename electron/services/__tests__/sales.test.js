const { 
  createSale,
  getAllSales,
  updateSale,
  archiveSale
} = require('../sales');

const mockDb = {
  get: jest.fn(),
  put: jest.fn(),
  find: jest.fn()
};

describe('Sales Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSale', () => {
    const saleData = {
      clientId: 'client1',
      price: 1000,
      currency: 'USD',
      rate: 145,
      projectId: 'project1'
    };

    it('should create a sale with currency conversion', async () => {
      mockDb.get.mockResolvedValue({ 
        currency: 'KES',
        balance: 150000
      });
      mockDb.put.mockResolvedValue({ id: 'newId' });

      const result = await createSale(mockDb, saleData);
      expect(result.success).toBe(true);
      expect(result.sale).toBeDefined();
      expect(mockDb.put).toHaveBeenCalledTimes(2);
    });

    it('should fail if client is not found', async () => {
      mockDb.get.mockRejectedValue(new Error('Not found'));

      const result = await createSale(mockDb, saleData);
      expect(result.success).toBe(false);
    });
  });

  describe('getAllSales', () => {
    it('should return all active sales', async () => {
      const mockSales = [
        { _id: '1', price: 1000 },
        { _id: '2', price: 2000 }
      ];
      
      mockDb.find.mockResolvedValue({ docs: mockSales });

      const result = await getAllSales(mockDb, 'project1');
      expect(result.success).toBe(true);
      expect(result.sales).toEqual(mockSales);
    });
  });

  // Add more test cases for updateSale and archiveSale...
});
