import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore'
import ReusableTable from '@/components/commonComp/reusableTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EllipsisVertical, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import InvoiceDetails from '@/components/invoicesComp/invoiceDetail'
import ConfirmDialog from '@/components/commonComp/confirmDialog'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [id, setId] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    itemToDelete: null
  })
  const project = useProjectStore(state => state.project)

  useEffect(() => {
    if (project?._id) {
      setId(project._id)
    }
  }, [project?._id])

  useEffect(() => {
    if (id) {
      fetchInvoices()
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
    { label: "Invoice Number", field: "invoiceNumber" },
    { label: "Supplier", field: "supplierName" },
    { label: "Currency", field: "currency" },
    { 
      label: "Amount", 
      field: "amount",
      format: (value) => value.toLocaleString(undefined, { minimumFractionDigits: 0 })
    },
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

  const fetchInvoices = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await window.electronAPI.mainOperation('getAllInvoices', id)
      if (response.success) {
        setInvoices(response.invoices)
      } else {
        setError(response.error || 'Failed to fetch invoices')
        setInvoices([])
      }
    } catch (error) {
      setError(error.message || 'Error fetching invoices')
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async (searchTerm) => {
    if (!searchTerm) return;
    try {
      const searchResult = await window.electronAPI.invoiceSearch(searchTerm, id);
      if (searchResult.success) {
        setInvoices(searchResult.invoices);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice)
    setIsSheetOpen(true)
  }

  const handleDelete = (invoice) => {
    setConfirmDialog({
      isOpen: true,
      itemToDelete: invoice
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await window.electronAPI.mainOperation(
        'archiveInvoice', 
        confirmDialog.itemToDelete._id
      )
      if (response.success) {
        setInvoices(invoices.filter(inv => inv._id !== confirmDialog.itemToDelete._id))
      }
    } catch (error) {
      setError(error.message || 'Error archiving invoice')
    } finally {
      setConfirmDialog({ isOpen: false, itemToDelete: null })
    }
  }

  return (
    <>
      <Card className="">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>View all invoices for this project</CardDescription>
          </div>
          <div>
            <Input
              type="text"
              placeholder="Search invoices"
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
            <ReusableTable headers={headers} data={invoices} />
          )}
        </CardContent>
      </Card>
      {selectedInvoice && (
        <InvoiceDetails
          invoice={selectedInvoice}
          isOpen={isSheetOpen}
          onClose={() => {
            setIsSheetOpen(false)
            setSelectedInvoice(null)
          }}
        />
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, itemToDelete: null })}
        onConfirm={handleConfirmDelete}
        title="Are you sure?"
        description="This action cannot be undone. This will permanently archive this invoice from the database."
      />
    </>
  )
}
