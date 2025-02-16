"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet"
import { SupplierForm } from './SupplierForm'

export default function SupplierModal({ supplier, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = async (updatedSupplier) => {
    try {
      const response = await window.electronAPI.mainOperation('updateSupplier', {
        ...supplier,
        ...updatedSupplier
      })

      if (response.success) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to update supplier:', error)
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Supplier' : 'Supplier Details'}
          </SheetTitle>
        </SheetHeader>

        {isEditing ? (
          <SupplierForm 
            supplier={supplier}
            onSubmit={handleUpdate}
            mode="edit"
          />
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1">{supplier.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1">{supplier.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1">{supplier.phoneNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1">{supplier.address}</p>
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
              Edit Supplier
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