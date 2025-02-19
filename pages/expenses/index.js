import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const project = useProjectStore(state => state.project)

  useEffect(() => {
    if (project?._id) {
      setId(project._id)
    }
  }, [project?._id])

  useEffect(() => {
    if (id) {
      fetchExpenses()
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
    { 
      label: "Amount", 
      field: "amount",
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0 })
    },
    { label: "Account", field: "accountName"},
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
        <div>
          <Input
            type="text"
            placeholder="Search expenses"
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
          <ReusableTable headers={headers} data={expenses} />
        )}
      </CardContent>
    </Card>
  )
}
