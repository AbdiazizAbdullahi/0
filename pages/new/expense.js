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
import { formatPesa } from "@/lib/utils" // Import formatPesa function
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import useProjectStore from "@/stores/projectStore"
import { useToast } from "@/hooks/use-toast"

const EXPENSE_TYPES = [
  { id: "utilities", label: "Utilities" },
  { id: "rent", label: "Rent" },
  { id: "clearance", label: "Clearance" },
  { id: "labour", label: "Labour" },
  { id: "petty cash", label: "Petty Cash" },
  { id: "maintenance", label: "Maintenance" },
  { id: "transport", label: "Transport" },
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
    pdfBase64: "" // Added for PDF base64 string
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

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          pdfBase64: reader.result // Store base64 string
        }))
      }
      reader.readAsDataURL(file)
    } else {
      // Handle error or clear if not a PDF
      setFormData(prev => ({
        ...prev,
        pdfBase64: ''
      }))
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF file.",
        variant: "destructive",
      })
    }
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
        pdfBase64: formData.pdfBase64, // Added PDF base64 string to payload
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
                  type="text"
                  value={formatPesa(formData.amount)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    handleChange({ target: { name: 'amount', value: numericValue } });
                  }}
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
          <div className="space-y-2">
            <Label htmlFor="pdfFile">Expense PDF (Optional)</Label>
            <Input
              id="pdfFile"
              name="pdfFile"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Expense"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
