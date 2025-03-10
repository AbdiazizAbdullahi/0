"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Search } from "lucide-react"
import SupplierModal from './SupplierModal'
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

export default function SupplierList({ refreshTrigger }) {
  const [suppliers, setSuppliers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveSupplierId, setArchiveSupplierId] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore((state) => state.project)
  const router = useRouter()

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    fetchSuppliers()
  }, [projectId, refreshTrigger])

  const fetchSuppliers = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllSuppliers', projectId)
      console.log('response', response)
      if (response.success) {
        setSuppliers(response.suppliers)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electronAPI.mainOperation('searchSuppliers', searchTerm)
      if (response.success) {
        setSuppliers(response.suppliers)
      }
    } catch (error) {
      console.error('Failed to search suppliers:', error)
    }
  }

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setIsModalOpen(true)
  }

  const handleArchiveSupplier = async () => {
    if (!archiveSupplierId) return

    try {
      const response = await window.electronAPI.mainOperation('archiveSupplier', archiveSupplierId)
      if (response.success) {
        fetchSuppliers()
        setIsAlertDialogOpen(false)
        setArchiveSupplierId(null)
      }
    } catch (error) {
      console.error('Failed to archive supplier:', error)
    }
  }

  const confirmArchiveSupplier = (supplierId) => {
    setArchiveSupplierId(supplierId)
    setIsAlertDialogOpen(true)
  }

  const filteredSuppliers = suppliers.filter(supplier => 
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search suppliers..." 
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
            {paginatedSuppliers.map((supplier) => (
              <tr key={supplier._id} className="border-b">
                <td className="p-4">{supplier.name}</td>
                <td className="p-4">{supplier.currency} {formatCurrency(supplier.balance)}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => router.push(`/suppliers/${supplier._id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmArchiveSupplier(supplier._id)}
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
            {Math.min(currentPage * rowsPerPage, filteredSuppliers.length)} of {filteredSuppliers.length} suppliers
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
              disabled={currentPage * rowsPerPage >= filteredSuppliers.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SupplierModal 
          supplier={selectedSupplier} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchSuppliers}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive the supplier. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveSupplier}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
