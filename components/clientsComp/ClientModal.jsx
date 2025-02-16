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
import { ClientForm } from './ClientForm'

export default function ClientModal({ client, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)

  const handleUpdate = async (updatedClient) => {
    try {
      const response = await window.electronAPI.mainOperation('updateClient', {
        ...client,
        ...updatedClient
      })

      if (response.success) {
        onUpdate()
        onClose()
      }
    } catch (error) {
      console.error('Failed to update client:', error)
    }
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Client' : 'Client Details'}
          </SheetTitle>
        </SheetHeader>

        {isEditing ? (
          <ClientForm 
            client={client}
            onSubmit={handleUpdate}
            mode="edit"
          />
        ) : (
          <div className="space-y-4 p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1">{client.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1">{client.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1">{client.phoneNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1">{client.address}</p>
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
              Edit Client
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