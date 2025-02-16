"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import SalesModal from './SalesModal'
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

export default function SalesList() {
  const [sales, setSales] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSale, setSelectedSale] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveSaleId, setArchiveSaleId] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllSales')
      if (response.success) {
        setSales(response.sales)
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electronAPI.mainOperation('searchSales', searchTerm)
      if (response.success) {
        setSales(response.sales)
      }
    } catch (error) {
      console.error('Failed to search sales:', error)
    }
  }

  const handleViewSale = (sale) => {
    setSelectedSale(sale)
    setIsModalOpen(true)
  }

  const handleArchiveSale = async () => {
    if (!archiveSaleId) return

    try {
      const response = await window.electronAPI.mainOperation('archiveSale', archiveSaleId)
      if (response.success) {
        fetchSales()
        setIsAlertDialogOpen(false)
        setArchiveSaleId(null)
      }
    } catch (error) {
      console.error('Failed to archive sale:', error)
    }
  }

  const confirmArchiveSale = (saleId) => {
    setArchiveSaleId(saleId)
    setIsAlertDialogOpen(true)
  }

  const filteredSales = sales.filter(sale => 
    sale.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search sales..." 
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
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Price</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.map((sale) => (
              <tr key={sale._id} className="border-b">
                <td className="p-4">{new Date(sale.date).toLocaleDateString()}</td>
                <td className="p-4">{sale.price}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewSale(sale)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmArchiveSale(sale._id)}
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
            {Math.min(currentPage * rowsPerPage, filteredSales.length)} of {filteredSales.length} sales
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
              disabled={currentPage * rowsPerPage >= filteredSales.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <SalesModal 
          sale={selectedSale} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchSales}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive the sale. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveSale}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}