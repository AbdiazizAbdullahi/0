"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import useProjectStore from "@/stores/projectStore"
import { useToast } from "@/hooks/use-toast"

export default function NewSale() {
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  const { toast } = useToast()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

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
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const saleData = {
        ...formData,
        price: parseFloat(formData.price),
        date: new Date(formData.date).toISOString(),
        projectId: project._id
      }

      const response = await window.electronAPI.mainOperation('createSale', saleData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Sale created successfully"
        })
        router.push('/sales')
      } else {
        throw new Error(response.error || 'Failed to create sale')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create sale. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Sale</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date) : undefined}
                  onSelect={(date) => {
                    setFormData(prev => ({
                      ...prev,
                      date: date ? new Date(date.setHours(12)).toISOString().split('T')[0] : ""
                    }))
                    setDatePickerOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => {
                const client = clients.find(c => c._id === value)
                setFormData(prev => ({
                  ...prev,
                  clientId: value,
                  clientName: client ? client.name : ''
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {clients.map(client => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter price"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="houseNo">House Number</Label>
              <Input
                id="houseNo"
                name="houseNo"
                value={formData.houseNo}
                onChange={handleChange}
                placeholder="Enter house number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agent">Agent</Label>
              <Select
                value={formData.agentId}
                onValueChange={(value) => {
                  const agent = agents.find(a => a._id === value)
                  setFormData(prev => ({
                    ...prev,
                    agentId: value,
                    agentName: agent ? agent.name : ''
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Commission</Label>
              <Input
                id="commission"
                name="commission"
                type="number"
                value={formData.commission}
                onChange={handleChange}
                placeholder="Enter commission"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Sale"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
