import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EllipsisVertical, Loader2, FilterIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import TransactionDetails from '@/components/transactionsComp/transactionDetail'
import ConfirmDialog from '@/components/commonComp/confirmDialog'
import { formatPesa } from '@/lib/utils'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const [accounts, setAccounts] = useState([])
  const project = useProjectStore(state => state.project)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    itemToDelete: null
  })
  const [filters, setFilters] = useState({
    dateRange: '',
    accountName: '',
    transType: '',
    amountRange: [, ],
    currency: ''
  })

  const TRANSACTION_TYPES = [
    { id: 'deposit', label: 'Deposit' },
    { id: 'withdraw', label: 'Withdrawal' }
  ]

  const CURRENCIES = [
    { id: 'KES', label: 'KES' },
    { id: 'USD', label: 'USD' }
  ]

  const DATE_RANGES = [
    { id: 'today', label: 'Today' },
    { id: 'past-week', label: 'Past Week' },
    { id: 'past-month', label: 'Past Month' }
  ]

  useEffect(() => {
    if (project?._id) {
      setId(project._id)
    }
  }, [project?._id])

  useEffect(() => {
    if (id) {
      fetchTransactions()
      fetchAccounts()
    }
  }, [id])

  const headers = [
    { 
      label: "Date", 
      field: "date",
      format: (value) => new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },
    { label: "Description", field: "description" },
    { label: "Currency", field: "currency" },
    { 
      label: "Amount",
      field: "amount",
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0 })
    },
    { label: "From", field: "fromName"},
    { label: "To", field: "toName"},
    { label: "Type", field: "transType" },
    { label: "Exchange Rate", field: "rate" },
    { 
      label: "Action",
      field: "action",
      format: (_, row) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <EllipsisVertical className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40">
            <div className="flex flex-col gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleView(row)}
              >
                View
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => handleDelete(row)}
              >
                Archive
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )
    },
  ]

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation("getAllAccounts", id)
      if (result.success) {
        setAccounts(result.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await window.electronAPI.mainOperation('getAllTransactions', id)
      if (response.success) {
        setTransactions(response.transactions)
      } else {
        setError(response.error || 'Failed to fetch transactions')
        setTransactions([])
      }
    } catch (error) {
      setError(error.message || 'Error fetching transactions')
      setTransactions([])
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    try {
      const searchResult = await window.electronAPI.transSearch(searchTerm, id);
      console.log('searchResult:', searchResult);
      if (searchResult.success) {
        setTransactions(searchResult.transactions);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  const handleView = (transaction) => {
    setSelectedTransaction(transaction)
    setIsSheetOpen(true)
  }

  const handleDelete = (transaction) => {
    setConfirmDialog({
      isOpen: true,
      itemToDelete: transaction
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await window.electronAPI.mainOperation(
        'archiveTransaction', 
        confirmDialog.itemToDelete._id
      )
      if (response.success) {
        setTransactions(transactions.filter(trans => trans._id !== confirmDialog.itemToDelete._id))
      }
    } catch (error) {
      setError(error.message || 'Error archiving transaction')
    } finally {
      setConfirmDialog({ isOpen: false, itemToDelete: null })
    }
  }

  const applyFilters = async () => {
    try {
      let startDate = null;
      let endDate = new Date();

      if (filters.dateRange) {
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'past-week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'past-month':
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        }
      }

      const filterPayload = {
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate.toISOString(),
        accountName: filters.accountName,
        transType: filters.transType,
        minAmount: filters.amountRange[0],
        maxAmount: filters.amountRange[1],
        currency: filters.currency
      };

      setLoading(true);
      const response = await window.electronAPI.mainOperation('filterTransactions', {
        projectId: id,
        filterData: filterPayload
      });
      
      if (response.success) {
        setTransactions(response.transactions);
        setIsSheetOpen(false);
      } else {
        setError(response.error || 'Failed to filter transactions');
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('Error filtering transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>View all transactions for this project</CardDescription>
          </div>
          <div className="flex gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Transactions</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>Date Range</Label>
                    <Select 
                      value={filters.dateRange}
                      onValueChange={(value) => setFilters({...filters, dateRange: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGES.map(range => (
                          <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>Account</Label>
                    <Select
                      value={filters.accountName}
                      onValueChange={(value) => setFilters({...filters, accountName: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account._id} value={account.name}>{account.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>Type</Label>
                    <Select 
                      value={filters.transType}
                      onValueChange={(value) => setFilters({...filters, transType: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPES.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>Currency</Label>
                    <Select 
                      value={filters.currency}
                      onValueChange={(value) => setFilters({...filters, currency: value})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem key={currency.id} value={currency.id}>{currency.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label>Amount Range</Label>
                    <div className="col-span-3 flex gap-2">
                      <Input
                        type="text"
                        placeholder="Min amount"
                        value={filters.amountRange[0] ? filters.amountRange[0].toLocaleString() : ''}
                        onChange={(e) => setFilters({...filters, amountRange: [Number(e.target.value.replace(/[^\d.-]/g, '')), filters.amountRange[1]]})}
                      />
                      <Input
                        type="text"
                        placeholder="Max amount"
                        value={filters.amountRange[1] ? filters.amountRange[1].toLocaleString() : ''}
                        onChange={(e) => setFilters({...filters, amountRange: [filters.amountRange[0], Number(e.target.value.replace(/[^\d.-]/g, ''))]})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {setFilters({
                        dateRange: '',
                        accountName: '',
                        transType: '',
                        amountRange: [0, 0],
                        currency: ''
                      })
                      fetchTransactions()
                      }}
                    >
                      Clear
                    </Button>
                    <Button onClick={applyFilters}>Apply</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Input
              type="text"
              placeholder="Search transactions"
              onChange={(e) => performSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-2">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ReusableTable headers={headers} data={transactions} />
          )}
        </CardContent>
      </Card>
      {selectedTransaction && (
        <TransactionDetails
          transaction={selectedTransaction}
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false)
            setSelectedTransaction(null)
          }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemToDelete: null })}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently archive this transaction from the database."
      />
    </>
  )
}
