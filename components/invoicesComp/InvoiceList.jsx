"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Search } from "lucide-react"
import InvoiceModal from './InvoiceModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [suppliers, setSuppliers] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveInvoiceId, setArchiveInvoiceId] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)

  useEffect(() => {
    fetchInvoices()
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllSuppliers')
      if (response.success) {
        const suppliersMap = {}
        response.suppliers.forEach(supplier => {
          suppliersMap[supplier._id] = supplier
        })
        setSuppliers(suppliersMap)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllInvoices')
      if (response.success) {
        setInvoices(response.invoices)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electronAPI.mainOperation('searchInvoices', searchTerm)
      if (response.success) {
        setInvoices(response.invoices)
      }
    } catch (error) {
      console.error('Failed to search invoices:', error)
    }
  }

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setIsModalOpen(true)
  }

  const handleArchiveInvoice = async () => {
    if (!archiveInvoiceId) return

    try {
      const response = await window.electronAPI.mainOperation('archiveInvoice', archiveInvoiceId)
      if (response.success) {
        fetchInvoices()
        setIsAlertDialogOpen(false)
        setArchiveInvoiceId(null)
      }
    } catch (error) {
      console.error('Failed to archive invoice:', error)
    }
  }

  const confirmArchiveInvoice = (invoiceId) => {
    setArchiveInvoiceId(invoiceId)
    setIsAlertDialogOpen(true)
  }

  const filteredInvoices = invoices.filter(invoice => 
    // invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (suppliers[invoice.supplierId]?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoices..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Client</th>
              <th className="text-left p-4">Total Amount</th>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.map((invoice) => (
              <tr key={invoice._id} className="border-b">
                <td className="p-4">{suppliers[invoice.supplierId]?.name || 'Loading...'}</td>
                <td className="p-4">{invoice.amount.toFixed(2)}</td>
                <td className="p-4">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmArchiveInvoice(invoice._id)}
                  >
                    Archive
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {Math.min(currentPage * rowsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage * rowsPerPage >= filteredInvoices.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <InvoiceModal 
          invoice={selectedInvoice} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchInvoices}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive the invoice. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveInvoice}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
