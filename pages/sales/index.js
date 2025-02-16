"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import SalesList from "@/components/salesComp/SalesList"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import Link from 'next/link'
import SalesForm from "@/components/salesComp/SalesForm"

export default function Sales() {
  const [isAddingSale, setIsAddingSale] = useState(false)

  const handleCreateSale = async (saleData) => {
    try {
      const response = await window.electronAPI.mainOperation('createSale', saleData)
      
      if (response.success) {
        setIsAddingSale(false)
        // You might want to add a toast or notification here
      } else {
        console.error('Sale creation failed:', response.error)
        // Handle error (e.g., show error message)
      }
    } catch (error) {
      console.error('Error creating sale:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Sales</h1>
          <p className="text-muted-foreground">Manage your sales.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddingSale(!isAddingSale)}>
            {isAddingSale ? 'Cancel' : 'Add Sale'}
          </Button>
        </div>
      </div>

      <Sheet open={isAddingSale} onOpenChange={setIsAddingSale}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SalesForm 
              onSubmit={handleCreateSale}
              mode="create"
              onClose={() => setIsAddingSale(false)}
              onUpdate={() => {}} // This will be used to refresh the list after creation
            />
          </div>
        </SheetContent>
      </Sheet>

      <SalesList />
    </div>
  )
}
