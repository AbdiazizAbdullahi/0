"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import SupplierList from "@/components/suppliersComp/SupplierList"
import { SupplierForm } from "@/components/suppliersComp/SupplierForm"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"
import Link from 'next/link'

export default function Suppliers() {
  const [isAddingSupplier, setIsAddingSupplier] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleCreateSupplier = async (supplierData) => {
    try {
      const response = await window.electronAPI.mainOperation('createSupplier', supplierData)
      
      if (response.success) {
        setIsAddingSupplier(false)
        setRefreshTrigger(prev => prev + 1) // Trigger refresh
        // You might want to add a toast or notification here
      } else {
        console.error('Supplier creation failed:', response.error)
        // Handle error (e.g., show error message)
      }
    } catch (error) {
      console.error('Error creating supplier:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your suppliers.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsAddingSupplier(!isAddingSupplier)}>
            {isAddingSupplier ? 'Cancel' : 'Add Supplier'}
          </Button>
        </div>
      </div>

      <Sheet open={isAddingSupplier} onOpenChange={setIsAddingSupplier}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SupplierForm 
              onSubmit={handleCreateSupplier}
              mode="create"
            />
          </div>
        </SheetContent>
      </Sheet>

      <SupplierList refreshTrigger={refreshTrigger} />
    </div>
  )
}
