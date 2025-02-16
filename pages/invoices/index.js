"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import InvoiceList from "@/components/invoicesComp/InvoiceList"
import InvoiceForm from "@/components/invoicesComp/InvoiceForm"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import Link from 'next/link'

export default function Invoices() {
  const [isAddingInvoice, setIsAddingInvoice] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateInvoice = async (invoiceData) => {
    try {
      const response = await window.electronAPI.mainOperation('createInvoice', invoiceData)
      
      if (response.success) {
        setIsAddingInvoice(false)
        setRefreshTrigger(prev => prev + 1)
      } else {
        console.error('Invoice creation failed:', response.error)
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddingInvoice(!isAddingInvoice)}>
            {isAddingInvoice ? 'Cancel' : 'Add Invoice'}
          </Button>
        </div>
      </div>

      <Sheet open={isAddingInvoice} onOpenChange={setIsAddingInvoice}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <InvoiceForm 
              onSubmit={handleCreateInvoice}
              mode="create"
            />
          </div>
        </SheetContent>
      </Sheet>

      <InvoiceList key={refreshTrigger} />
    </div>
  )
}
