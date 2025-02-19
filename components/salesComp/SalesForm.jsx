"use client"

import React, { useState, useEffect } from 'react'
import useProjectStore from '@/stores/projectStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area'

export default function SalesForm({ sale, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    date: '',
    price: '',
    description: '',
    houseNo: '',
    clientId: '',
    projectId: '',
    agentId: '',
    commission: 0,
    projectId: ''
  })

  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [agents, setAgents] = useState([])
  const project = useProjectStore(state => state.project)

  useEffect(() => {
    // Fetch clients, projects, and agents
    const fetchLists = async () => {
      try {
        const clientsResponse = await window.electronAPI.mainOperation('getAllClients')
        const projectsResponse = await window.electronAPI.mainOperation('getAllProjects')
        const agentsResponse = await window.electronAPI.mainOperation('getAllAgents')

        if (clientsResponse.success) setClients(clientsResponse.clients)
        if (projectsResponse.success) setProjects(projectsResponse.projects)
        if (agentsResponse.success) setAgents(agentsResponse.agents)
      } catch (error) {
        console.error('Error fetching lists:', error)
      }
    }

    fetchLists()
  }, [])

  useEffect(() => {
    if (sale) {
      setFormData({
        date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : '',
        price: sale.price ? sale.price.toString() : '',
        description: sale.description || '',
        houseNo: sale.houseNo || '',
        clientId: sale.clientId || '',
        projectId: sale.projectId || '',
        agentId: sale.agentId || '',
        commission: sale.commission || 0
      })
    }
  }, [sale])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const saleData = {
        ...formData,
        price: parseFloat(formData.price),
        date: new Date(formData.date).toISOString(),
        projectId: project._id
      }

      let response
      if (sale) {
        // Update existing sale
        response = await window.electronAPI.mainOperation('updateSale', { 
          id: sale._id, 
          data: saleData 
        })
      } else {
        // Create new sale
        response = await window.electronAPI.mainOperation('createSale', saleData)
      }

      if (response.success) {
        onUpdate()
        onClose()
      } else {
        console.error('Failed to save sale:', response.error)
      }
    } catch (error) {
      console.error('Error saving sale:', error)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{sale ? 'Edit Sale' : 'Add New Sale'}</DialogTitle>
        <DialogDescription>
          {sale ? 'Update the details of this sale' : 'Enter details for a new sale'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Date</Label>
          <Input 
            type="date" 
            name="date"
            value={formData.date}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <Label>Price</Label>
          <Input 
            type="number" 
            name="price"
            value={formData.price}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <Label>commission</Label>
          <Input 
            type="number" 
            name="commission"
            value={formData.commission}
            onChange={handleChange}
            required 
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input 
            type="text" 
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>House Number</Label>
          <Input 
            type="text" 
            name="houseNo"
            value={formData.houseNo}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Client</Label>
          <Select 
            value={formData.clientId} 
            onValueChange={(value) => handleSelectChange('clientId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px] w-full">
              {clients.map((client) => (
                <SelectItem key={client._id} value={client._id}>
                  {client.name}
                </SelectItem>
              ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Project</Label>
          <Select 
            value={formData.projectId} 
            onValueChange={(value) => handleSelectChange('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Agent</Label>
          <Select 
            value={formData.agentId} 
            onValueChange={(value) => handleSelectChange('agentId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit">
            {sale ? 'Update Sale' : 'Create Sale'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}