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
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import useProjectStore from "@/stores/projectStore"
import { useToast } from "@/hooks/use-toast"
import { formatPesa } from "@/lib/utils"

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
    projectId: '',
    currency: 'KES',
    rate: '1'
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
        projectId: project._id,
        rate: parseFloat(formData.rate)
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
              <PopoverContent 
                className="w-auto p-3 bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800" 
                align="start"
              >
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
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3"
                  components={{
                    IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" />,
                    IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" />,
                  }}
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_dropdowns: "flex justify-center gap-1 items-center px-8",
                    dropdown: "appearance-none outline-none inline-flex items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800",
                    dropdown_month: "mr-1",
                    dropdown_year: "ml-1",
                    head_row: "flex",
                    head_cell: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-zinc-400",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm relative p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md focus-within:relative focus-within:z-20 transition-colors",
                    day: cn(
                      "h-9 w-9 p-0 font-normal",
                      "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                      "focus:outline-none focus:ring-2 focus:ring-primary"
                    ),
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-zinc-400 opacity-50 dark:text-zinc-500",
                    day_disabled: "text-zinc-400 opacity-50 dark:text-zinc-500",
                    day_hidden: "invisible",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                  }}
                  showOutsideDays
                  captionLayout="dropdown-buttons"
                  fromYear={2010}
                  toYear={2050}
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
                type="text"
                value={formatPesa(formData.price)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  handleChange({ target: { name: 'price', value: numericValue } });
                }}
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
                type="text"
                value={formatPesa(formData.commission)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  handleChange({ target: { name: 'commission', value: numericValue } });
                }}
                placeholder="Enter commission"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KES">KES</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Exchange Rate</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                value={formData.rate}
                onChange={handleChange}
                placeholder="Enter exchange rate"
                step="0.01"
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
