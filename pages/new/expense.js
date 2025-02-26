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
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import useProjectStore from "@/stores/projectStore"
import { useToast } from "@/hooks/use-toast"

const EXPENSE_TYPES = [
  { id: "utilities", label: "Utilities" },
  { id: "rent", label: "Rent" },
  { id: "supplies", label: "Supplies" },
  { id: "salary", label: "Salary" },
  { id: "marketing", label: "Marketing" },
  { id: "maintenance", label: "Maintenance" },
  { id: "travel", label: "Travel" },
  { id: "other", label: "Other" },
]

const CURRENCIES = [
  { id: "KES", label: "KES" },
  { id: "USD", label: "USD" },
]

export default function NewExpense() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    date: "",
    accountId: "",
    accountName: "",
    expenseType: "",
    currency: "KES",
    rate: "1", // Add rate with default value
  })
  const [accounts, setAccounts] = useState([])
  const [projectId, setProjectId] = useState("")
  const project = useProjectStore((state) => state.project)
  const { toast } = useToast()
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    if (projectId) {
      fetchAccounts()
    }
  }, [projectId])

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation("getAllAccounts", projectId)
      if (result.success) {
        setAccounts(result.accounts || [])
      } else {
        setAccounts([])
        toast({
          title: "Error",
          description: "Failed to fetch accounts. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setAccounts([])
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = {
        description: formData.description,
        amount: Number.parseFloat(formData.amount),
        date: formData.date,
        accountId: formData.accountId,
        accountName: formData.accountName,
        expenseType: formData.expenseType,
        currency: formData.currency,
        rate: Number.parseFloat(formData.rate), // Add rate to payload
        projectId: projectId,
      }
      const response = await window.electronAPI.mainOperation("createExpense", payload)
      if (response.success) {
        toast({
          title: "Success",
          description: "Expense created successfully.",
        })
        router.push("/expenses")
      } else {
        throw new Error(response.error || "Failed to create expense")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Expense</CardTitle>
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
                    !formData.date && "text-muted-foreground",
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
                    setFormData((prev) => ({
                      ...prev,
                      date: date ? new Date(date.setHours(12)).toISOString().split('T')[0] : "",
                    }))
                    setDatePickerOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter expense description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <Select
                value={formData.currency}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    currency: value,
                  }))
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Exchange Rate</Label>
            <Input
              id="rate"
              name="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={handleChange}
              placeholder="Enter exchange rate"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="account">Account</Label>
            <Select
              onValueChange={(value) => {
                const account = accounts.find((acc) => acc._id === value)
                setFormData((prev) => ({
                  ...prev,
                  accountId: account._id,
                  accountName: account.name,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account._id} value={account._id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expenseType">Expense Type</Label>
            <Select
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  expenseType: value,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

