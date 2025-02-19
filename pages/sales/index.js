import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, SquareChartGantt } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Sales() {
  const [sales, setSales] = useState([])
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
      fetchSales()
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
    { label: "Client", field: "clientName" },
    { 
      label: "Price", 
      field: "price",
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0 })
    },
    { label: "Unit", field: "houseNo" },
    { 
      label: "Action",
      field: "action",
      format: (_, row) => (
        <Button variant="ghost" size="icon" asChild>
          <Link href={`sales/${row._id}`}>
            <SquareChartGantt className="h-4 w-4" />
          </Link>
        </Button>
      )
    },
  ]

  const fetchSales = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await window.electronAPI.mainOperation('getAllSales', id)
      if (response.success) {
        setSales(response.sales)
      } else {
        setError(response.error || 'Failed to fetch sales')
        setSales([])
      }
    } catch (error) {
      setError(error.message || 'Error fetching sales')
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    try {
      const searchResult = await window.electronAPI.salesSearch(searchTerm, id)
      console.log('searchResult:', searchResult);
      if (searchResult.success) {
        setSales(searchResult.sales);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  const handleEdit = (sale) => {
    // Implement edit logic
    console.log('Edit sale:', sale)
  }

  const handleDelete = (sale) => {
    // Implement delete logic
    console.log('Delete sale:', sale)
  }

  return (
    <Card className="">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Sales</CardTitle>
          <CardDescription>View all sales for this project</CardDescription>
        </div>
        <div>
          <Input
            type="text"
            placeholder="Search sales"
            className=""
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
          <ReusableTable headers={headers} data={sales} />
        )}
      </CardContent>
    </Card>
  )
}
