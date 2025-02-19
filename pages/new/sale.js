"use client"

import React, { useState, useEffect } from 'react'
import useProjectStore from '@/stores/projectStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/router'

export default function NewSale() {
  const [formData, setFormData] = useState({
    date: '',
    price: '',
    houseNo: '',
    clientId: '',
    clientName: '',
    agentId: '',
    agentName: '',
    commission: 0,
    projectId: ''
  })
  const [clients, setClients] = useState([])
  const [agents, setAgents] = useState([])
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore(state => state.project)
  const router = useRouter()

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const clientsResponse = await window.electronAPI.mainOperation('getAllClients', projectId)
        const agentsResponse = await window.electronAPI.mainOperation('getAllAgents', projectId)

        if (clientsResponse.success) setClients(clientsResponse.clients)
        if (agentsResponse.success) setAgents(agentsResponse.agents)
      } catch (error) {
        console.error('Error fetching lists:', error)
      }
    }
    fetchLists()
  }, [projectId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      console.log(saleData)

      const response = await window.electronAPI.mainOperation('createSale', saleData)

      if (response.success) {
        // Handle success, e.g., navigate or display a notification
        router.push('/sales')
        console.log('Sale created successfully!')
      } else {
        console.error('Failed to save sale:', response.error)
      }
    } catch (error) {
      console.error('Error saving sale:', error)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Sale</h1>
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
          <Label>Client</Label>
          <Select 
            value={formData.clientId} 
            onValueChange={(value) => {
              const client = clients.find(c => c._id === value);
              setFormData(prev => ({
                ...prev,
                clientId: value,
                clientName: client ? client.name : ''
              }));
            }}
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
          <Label>House Number</Label>
          <Input 
            type="text" 
            name="houseNo"
            value={formData.houseNo}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Commission</Label>
          <Input 
            type="number" 
            name="commission"
            value={formData.commission}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Agent</Label>
          <Select 
            value={formData.agentId} 
            onValueChange={(value) => {
              const agent = agents.find(a => a._id === value);
              setFormData(prev => ({
                ...prev,
                agentId: value,
                agentName: agent ? agent.name : ''
              }));
            }}
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
        <div>
          <Button type="submit">
            Create Sale
          </Button>
        </div>
      </form>
    </div>
  )
}
