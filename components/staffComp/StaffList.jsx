"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Search } from "lucide-react"
import StaffModal from './StaffModal'

export default function StaffList() {
  const [staff, setStaff] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllStaff')
      if (response.success) {
        setStaff(response.staff)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electron.invoke('main-operation', 'searchStaff', searchTerm)
      if (response.success) {
        setStaff(response.staff)
      }
    } catch (error) {
      console.error('Failed to search staff:', error)
    }
  }

  const handleViewStaff = (staffMember) => {
    setSelectedStaff(staffMember)
    setIsModalOpen(true)
  }

  const handleArchiveStaff = async (staffId) => {
    try {
      const response = await window.electron.invoke('main-operation', 'archiveStaff', staffId)
      if (response.success) {
        fetchStaff()
      }
    } catch (error) {
      console.error('Failed to archive staff:', error)
    }
  }

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search staff..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Select 
          value={rowsPerPage.toString()} 
          onValueChange={(value) => setRowsPerPage(Number(value))}
        >
          <option value="5">5 rows</option>
          <option value="10">10 rows</option>
          <option value="20">20 rows</option>
        </Select>
      </div>

      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Phone Number</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStaff.map((member) => (
              <tr key={member._id} className="border-b">
                <td className="p-4">{member.name}</td>
                <td className="p-4">{member.phoneNumber}</td>
                <td className="p-4">{member.role}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewStaff(member)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleArchiveStaff(member._id)}
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
            {/* Showing {(currentPage - 1) * rowsPerPage + 1}- */}
            {Math.min(currentPage * rowsPerPage, filteredStaff.length) } of {filteredStaff.length} staff members
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
              disabled={currentPage * rowsPerPage >= filteredStaff.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <StaffModal 
          staff={selectedStaff} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchStaff}
        />
      )}
    </>
  )
}
