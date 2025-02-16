"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import StaffList from "@/components/staffComp/StaffList"
import StaffForm from "@/components/staffComp/StaffForm"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"

export default function Staff() {
  const [isAddingStaff, setIsAddingStaff] = useState(false)

  const handleCreateStaff = async (staffData) => {
    try {
      const response = await window.electronAPI.mainOperation('createStaff', staffData)
      
      if (response.success) {
        setIsAddingStaff(false)
        // You might want to add a toast or notification here
      } else {
        console.error('Staff creation failed:', response.error)
        // Handle error (e.g., show error message)
      }
    } catch (error) {
      console.error('Error creating staff:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Staff</h1>
          <p className="text-muted-foreground">Manage your team members.</p>
        </div>
        <div className="flex">
          <Button onClick={() => setIsAddingStaff(!isAddingStaff)}>
            {isAddingStaff ? 'Cancel' : 'Add Staff'}
          </Button>
        </div>
      </div>

      <Sheet open={isAddingStaff} onOpenChange={setIsAddingStaff}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Add New Staff Member</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <StaffForm 
              onSubmit={handleCreateStaff}
              mode="create"
            />
          </div>
        </SheetContent>
      </Sheet>

      <StaffList />
    </div>
  )
}
