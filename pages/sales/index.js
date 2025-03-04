import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, SquareChartGantt, EllipsisVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import SaleDetails from '@/components/salesComp/saleDetail'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ConfirmDialog from '@/components/commonComp/confirmDialog'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const project = useProjectStore(state => state.project)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    itemToDelete: null
  })

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
    { label: "Currency", field: "currency" },
    { 
      label: "Price", 
      field: "price",
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0 })
    },
    { label: "Unit", field: "houseNo" },
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
    setConfirmDialog({
      isOpen: true,
      itemToDelete: sale
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await window.electronAPI.mainOperation(
        'archiveSale', 
        confirmDialog.itemToDelete._id
      )
      if (response.success) {
        setSales(sales.filter(s => s._id !== confirmDialog.itemToDelete._id))
      }
    } catch (error) {
      setError(error.message || 'Error archiving sale')
    } finally {
      setConfirmDialog({ isOpen: false, itemToDelete: null })
    }
  }

  const handleView = (sale) => {
    setSelectedSale(sale)
    setIsSheetOpen(true)
  }

  return (
    <>
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
      {selectedSale && (
        <SaleDetails
          sale={selectedSale}
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false)
            setSelectedSale(null)
          }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemToDelete: null })}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently archive this sale from the database."
      />
    </>
  )
}
