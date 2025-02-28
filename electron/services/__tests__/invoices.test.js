const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  archiveInvoice
} = require('../invoices');

const mockDb = {
  get: jest.fn(),
  put: jest.fn(),
  find: jest.fn()
};

describe('Invoice Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvoice', () => {
    const invoiceData = {
      supplierId: 'supplier1',
      amount: 1000,
      description: 'Test invoice',
      date: '2023-01-01',
      currency: 'USD',
      rate: 145,
      projectId: 'project1'
    };

    it('should create an invoice with currency conversion', async () => {
      mockDb.get.mockResolvedValue({ 
        currency: 'KES',
        balance: 0
      });
      mockDb.put.mockResolvedValue({ id: 'newId' });

      const result = await createInvoice(mockDb, invoiceData);
      expect(result.success).toBe(true);
      expect(result.invoice).toBeDefined();
      expect(mockDb.put).toHaveBeenCalledTimes(2);
    });

    it('should fail if supplier is not found', async () => {
      mockDb.get.mockRejectedValue(new Error('Not found'));

      const result = await createInvoice(mockDb, invoiceData);
      expect(result.success).toBe(false);
    });
  });

  describe('getAllInvoices', () => {
    it('should return all active invoices', async () => {
      const mockInvoices = [
        { _id: '1', amount: 1000 },
        { _id: '2', amount: 2000 }
      ];
      
      mockDb.find.mockResolvedValue({ docs: mockInvoices });

      const result = await getAllInvoices(mockDb, 'project1');
      expect(result.success).toBe(true);
      expect(result.invoices).toEqual(mockInvoices);
    });
  });

  // Add more test cases for other methods...
});
