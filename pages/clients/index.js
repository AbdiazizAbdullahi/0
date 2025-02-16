"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import ClientList from "@/components/clientsComp/ClientList"
import { ClientForm } from "@/components/clientsComp/ClientForm"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet"

export default function Clients() {
  const [isAddingClient, setIsAddingClient] = useState(false)

  const handleCreateClient = async (clientData) => {
    try {
      const response = await window.electronAPI.mainOperation('createClient', clientData)
      
      if (response.success) {
        setIsAddingClient(false)
        // You might want to add a toast or notification here
      } else {
        console.error('Client creation failed:', response.error)
        // Handle error (e.g., show error message)
      }
    } catch (error) {
      console.error('Error creating client:', error)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground">Manage your client relationships.</p>
        </div>
        <div className="flex">
          <Button onClick={() => setIsAddingClient(!isAddingClient)}>
            {isAddingClient ? 'Cancel' : 'Add Client'}
          </Button>
        </div>
      </div>

      <Sheet open={isAddingClient} onOpenChange={setIsAddingClient}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle></SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ClientForm 
              onSubmit={handleCreateClient}
              mode="create"
            />
          </div>
        </SheetContent>
      </Sheet>

      <ClientList />
    </div>
  )
}
