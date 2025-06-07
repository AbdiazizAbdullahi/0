"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import AgentModal from './AgentModal'
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

export default function AgentList({ refreshTrigger }) {
  const [agents, setAgents] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [archiveAgentId, setArchiveAgentId] = useState(null)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore((state) => state.project)
  const router = useRouter();

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    fetchAgents()
  }, [projectId, refreshTrigger])

  const fetchAgents = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllAgents', projectId)
      if (response.success) {
        setAgents(response.agents)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }

  const handleSearch = async () => {
    try {
      const response = await window.electronAPI.mainOperation('searchAgents', searchTerm)
      if (response.success) {
        setAgents(response.agents)
      }
    } catch (error) {
      console.error('Failed to search agents:', error)
    }
  }

  const handleViewAgent = (agent) => {
    router.push(`/agents/${agent._id}`)
  }

  const handleArchiveAgent = async () => {
    if (!archiveAgentId) return

    try {
      const response = await window.electronAPI.mainOperation('archiveAgent', archiveAgentId)
      if (response.success) {
        fetchAgents()
        setIsAlertDialogOpen(false)
        setArchiveAgentId(null)
      }
    } catch (error) {
      console.error('Failed to archive agent:', error)
    }
  }

  const confirmArchiveAgent = (agentId) => {
    setArchiveAgentId(agentId)
    setIsAlertDialogOpen(true)
  }

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedAgents = filteredAgents.slice(
    (currentPage - 1) * rowsPerPage, 
    currentPage * rowsPerPage
  )

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search agents..." 
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
            {paginatedAgents.map((agent) => (
              <tr key={agent._id} className="border-b">
                <td className="p-4">{agent.name}</td>
                <td className={`p-4 ${agent.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{agent.balance >= 0 ? `${agent.currency} ${formatCurrency(agent.balance)}` : `${agent.currency} [-${formatCurrency(Math.abs(agent.balance))}]`}</td>
                <td className="p-4 flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => handleViewAgent(agent)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmArchiveAgent(agent._id)}
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
            {Math.min(currentPage * rowsPerPage, filteredAgents.length)} of {filteredAgents.length} agents
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
              disabled={currentPage * rowsPerPage >= filteredAgents.length}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AgentModal 
          agent={selectedAgent} 
          onClose={() => setIsModalOpen(false)}
          onUpdate={fetchAgents}
        />
      )}

      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive the agent. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveAgent}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
