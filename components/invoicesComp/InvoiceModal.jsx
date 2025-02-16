"use client"

import { useState, useEffect } from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import InvoiceForm from './InvoiceForm'

export default function InvoiceModal({ invoice, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [supplierName, setSupplierName] = useState('')

  const fetchSupplierName = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getSupplierById', invoice.supplierId)
      if (response.success) {
        setSupplierName(response.supplier.name)
      }
    } catch (error) {
      console.error('Failed to fetch supplier:', error)
    }
  }

  useEffect(() => {
    if (invoice.supplierId) {
      fetchSupplierName()
    }
  }, [invoice.supplierId])

  const handleUpdate = async (updatedInvoice) => {
    try {
      const response = await window.electronAPI.mainOperation('updateInvoice', {
        ...invoice,
        ...updatedInvoice
      })

      if (response.success) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to update invoice:', error)
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Invoice' : 'Invoice Details'}
          </SheetTitle>
        </SheetHeader>

        {isEditing ? (
          <InvoiceForm 
            invoice={invoice} 
            onSubmit={handleUpdate}
          />
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
              <p className="mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supplier</label>
              <p className="mt-1">{supplierName || 'Loading...'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Amount</label>
              <p className="mt-1">{invoice.amount.toFixed(2)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1">{invoice.description || 'No description'}</p>
            </div>
          </div>
        )}

        <SheetFooter className="mt-4 p-4">
          {!isEditing ? (
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setIsEditing(true)}
            >
              Edit Invoice
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setIsEditing(false)}
            >
              Cancel Edit
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
