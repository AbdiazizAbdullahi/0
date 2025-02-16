import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
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
      fetchTransactions()
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
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 2 })
    },
    { label: "Currency", field: "currency" },
    { label: "From", field: "fromName"},
    { label: "To", field: "toName"},
    { label: "Type", field: "transType" }
  ]

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
      const searchResult = await window.electronAPI.searchCS(searchTerm, id);
      if (searchResult.success) {
        setSearchResult(searchResult.result);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  return (
    <Card className="">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>View all transactions for this project</CardDescription>
        </div>
        <div>
          <input
            type="text"
            placeholder="Search transactions"
            className="border border-gray-300 rounded-md p-2"
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
  )
}
