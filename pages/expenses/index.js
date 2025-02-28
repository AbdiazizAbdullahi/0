import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterIcon } from 'lucide-react'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const project = useProjectStore(state => state.project)
  const [accounts, setAccounts] = useState([])
  const [filters, setFilters] = useState({
    dateRange: '',
    expenseType: '',
    accountName: ''
  })
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const EXPENSE_TYPES = [
    { id: "utilities", label: "Utilities" },
    { id: "rent", label: "Rent" },
    { id: "clearance", label: "Clearance" },
    { id: "labour", label: "Labour" },
    { id: "petty cash", label: "Petty Cash" },
    { id: "maintenance", label: "Maintenance" },
    { id: "transport", label: "Transport" },
    { id: "other", label: "Other" },
  ]

  const DATE_RANGES = [
    { id: "today", label: "Today" },
    { id: "past-week", label: "Past Week" },
    { id: "past-month", label: "Past Month" },
  ]

  useEffect(() => {
    if (project?._id) {
      setId(project._id)
    }
  }, [project?._id])

  useEffect(() => {
    if (id) {
      fetchExpenses()
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
    { label: "Account", field: "accountName"},
    { label: "Exchange Rate", field: "rate" },
  ]

  const fetchExpenses = async () => {
    console.log(id)
    setLoading(true)
    setError(null)
    try {
      const response = await window.electronAPI.mainOperation('getAllExpenses', id)
      console.log(response)
      if (response.success) {
        setExpenses(response.expenses)
      } else {
        setError(response.error || 'Failed to fetch expenses')
        setExpenses([])
      }
    } catch (error) {
      setError(error.message || 'Error fetching expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

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

  const applyFilters = async () => {
    try {
      let startDate = null;
      let endDate = new Date();

      // Calculate date ranges
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
        expenseType: filters.expenseType,
        accountName: filters.accountName
      };

      setLoading(true);
      const response = await window.electronAPI.mainOperation('filterExpenses', {
        projectId: id,
        filterData: filterPayload
      });
      
      if (response.success) {
        setExpenses(response.expenses);
        setIsSheetOpen(false);
      } else {
        setError(response.error || 'Failed to filter expenses');
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('Error filtering expenses');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateRange: '',
      expenseType: '',
      accountName: ''
    })
    fetchExpenses()
    setIsSheetOpen(false)
  }

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    try {
      const searchResult = await window.electronAPI.expenseSearch(searchTerm, id)
      console.log('searchResult:', searchResult)
      if (searchResult.success) {
        setExpenses(searchResult.expenses)
      }
    } catch (error) {
      console.error('Error during search:', error)
    }
  };

  return (
    <Card className="">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>View all expenses for this project</CardDescription>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search expenses"
            onChange={(e) => performSearch(e.target.value)}
          />
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Expenses</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_RANGES.map((range) => (
                        <SelectItem key={range.id} value={range.id}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expense Type</Label>
                  <Select
                    value={filters.expenseType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, expenseType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select
                    value={filters.accountName}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, accountName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account._id} value={account.name}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
          <ReusableTable headers={headers} data={expenses} />
        )}
      </CardContent>
    </Card>
  )
}
