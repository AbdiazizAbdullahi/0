"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter,
  SheetClose 
} from "@/components/ui/sheet"
import StaffForm from './StaffForm'

export default function StaffModal({ staff, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = async (updatedStaff) => {
    try {
      const response = await window.electronAPI.mainOperation('updateStaff', {
        ...staff,
        ...updatedStaff
      })

      if (response.success) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to update staff:', error)
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Staff' : 'Staff Details'}
          </SheetTitle>
        </SheetHeader>

        {isEditing ? (
          <StaffForm 
            initialData={staff}
            onSubmit={handleUpdate}
            mode="edit"
          />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1">{staff.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1">{staff.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1">{staff.phoneNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <p className="mt-1">{staff.department}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1">{staff.role}</p>
            </div>
          </div>
        )}

        <SheetFooter className="mt-4">
          {!isEditing ? (
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => setIsEditing(true)}
            >
              Edit Staff
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
