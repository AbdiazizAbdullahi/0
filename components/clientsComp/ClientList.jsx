"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import ClientModal from './ClientModal'
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
import useProjectStore from '@/stores/projectStore'
import { useRouter } from 'next/router'
import { formatCurrency } from '@/lib/utils'

export default function ClientList({ refreshTrigger }) {
  const [clients, setClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveClientId, setArchiveClientId] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore(state => state.project)
  const router = useRouter()

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    fetchClients()
  }, [projectId, refreshTrigger])

  const fetchClients = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllClients', projectId)
      if (response.success) {
        setClients(response.clients)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electronAPI.mainOperation('searchClients', searchTerm)
      if (response.success) {
        setClients(response.clients)
      }
    } catch (error) {
      console.error('Failed to search clients:', error)
    }
  }

  const handleViewClient = (client) => {
    router.push(`/clients/${client._id}`)
  }

  const handleArchiveClient = async () => {
    if (!archiveClientId) return

    try {
      const response = await window.electronAPI.mainOperation('archiveClient', archiveClientId)
      if (response.success) {
        fetchClients()
        setIsAlertDialogOpen(false)
        setArchiveClientId(null)
      }
    } catch (error) {
      console.error('Failed to archive client:', error)
    }
  }

  const confirmArchiveClient = (clientId) => {
    setArchiveClientId(clientId)
    setIsAlertDialogOpen(true)
  }

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search clients..." 
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
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Balance</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClients.map((client) => (
              <tr key={client._id} className="border-b">
                <td className="p-4">{client.name}</td>
                <td className={`p-4 ${client.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{client.balance >= 0 ? `${client.currency} ${formatCurrency(client.balance)}` : `${client.currency} [-${formatCurrency(Math.abs(client.balance))}]`}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewClient(client)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmArchiveClient(client._id)}
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
            {Math.min(currentPage * rowsPerPage, filteredClients.length)} of {filteredClients.length} clients
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
              disabled={currentPage * rowsPerPage >= filteredClients.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <ClientModal 
          client={selectedClient} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchClients}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive the client. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveClient}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}