"use client"

import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPesa } from '@/lib/utils';

export default function NewTransaction() {
  const router = useRouter();
  // ... Copy all state declarations from AddTransaction ...
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const [rate, setRate] = useState(1);
  const [accounts, setAccounts] = useState([]);
  const [description, setDescription] = useState("")
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState("account");
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [transType, setTransType] = useState("deposit");
  const [date, setDate] = useState(() => new Date());
  const [fromLabel, setFromLabel] = useState("");
  const [toLabel, setToLabel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'default' });
  const [projectId, setProjectId] = useState(null);
  const project = useProjectStore(state => state.project);

  // ... Copy all useEffect hooks and helper functions from AddTransaction ...
  useEffect(() => {
    setProjectId(project._id);
  }, [project]);
  
  useEffect(() => {
    fetchAccounts();
  }, [projectId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm && transType === "deposit") {
        performSearch(searchTerm, source);
      } else if (searchTerm && transType === "withdraw") {
        performSearch(searchTerm, destination);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, projectId]);

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation('getAllAccounts', projectId);
      if (result.success) {
        setAccounts(result.accounts || []);
      } else {
        setAccounts([]);
        console.error('Failed to fetch accounts:', result.error);
      }
    } catch (error) {
      setAccounts([]);
      console.error('Error fetching accounts:', error);
    }
  };
  
  const performSearch = async (searchTerm, type) => {
    if (!searchTerm) return;
    try {
      const searchResult = await window.electronAPI.searchCS(searchTerm, type, projectId);
      if (searchResult.success) {
        setSearchResult(searchResult.result);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };
  
  const handleAccountAllocation = (value) => {
    if (value === "deposit") {
      setTransType("deposit");
      setDestination("account");
      setSource(null);
      setFrom(null);
      setFromLabel("");
      setDescription("");
      setAmount(0);
      setDate(() => new Date());
    } else if (value === "withdraw") {
      setTransType("withdraw"); 
      setSource("account");
      setDestination(null);
      setTo(null);
      setToLabel("");
      setDescription("");
      setAmount(0);
      setDate(() => new Date());
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const transData = {
        "_id": `${uuidv4()}`,
        "description": description,
        "transType": transType,
        "source": source,
        "destination": destination,
        "from": from,
        "fromName": fromLabel,
        "to": to,
        "toName": toLabel,
        "amount": parseInt(amount),
        "currency": currency,
        "rate": rate,
        "date": date.toISOString(),
        "projectId": projectId
      }

      const result = await window.electronAPI.mainOperation('createTransaction', transData);
      if (result.success) {
        router.push('/transactions'); // Navigate back to transactions list
      } else {
        throw new Error(result.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
      setAlert({
        show: true,
        message: `Failed to record transaction. ${error}.`,
        type: 'error'
      });
    }
  }

  const renderSourceDestinationSearch = (type, label, setLabel, setValue, dialogState, setDialogState) => (
      <div className="space-y-2">
        <Label htmlFor={`${type}-select`}>{type === 'client' || type === 'supplier' || type === 'agent' ? 'From' : 'To'}</Label>
        <Dialog open={dialogState} onOpenChange={setDialogState}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={dialogState}
              className="w-full justify-between"
              id={`${type}-select`}
            >
              {label || `Select ${type}`}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select {type}</DialogTitle>
              <DialogDescription>Search and select a specific {type}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="sticky top-0 bg-background px-3 pb-3 pt-2">
                <Input
                  placeholder={`Search ${type}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                  onFocus={(e) => e.target.select()}
                  autoFocus
                />
              </div>
              <ScrollArea className="h-[200px]">
                {searchResult.length > 0 ? (
                  <div className="space-y-1 px-1">
                    {searchResult.map((item) => (
                      <Button
                        key={item._id}
                        variant="ghost"
                        className="w-full justify-start font-normal"
                        onClick={() => {
                          setLabel(item.name)
                          setValue(item._id)
                          setSearchTerm("")
                          setSearchResult([])
                          setDialogState(false)
                        }}
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground">No results found</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )

  return (
    <Card className="container mx-auto py-10 space-y-6">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-3xl font-bold">New Transaction</CardTitle>
        <Button variant="outline" onClick={() => router.push('/transactions')}>Cancel</Button>
      </CardHeader>

      {alert.show && (
        <Alert variant={alert.type}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <CardContent className="max-w-2xl mx-auto">
        <Tabs 
          defaultValue="deposit" 
          onValueChange={(value) => handleAccountAllocation(value)} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          <TabsContent value="deposit">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Fill the transaction description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Select 
                    onValueChange={(value) => {
                      setSource(value);
                      setFrom(null);
                      setFromLabel(null)
                    }}
                  >
                    <SelectTrigger className="w-[100%]">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {source === "account" && (
                  <div className="space-y-2">
                    <Label htmlFor="from">From</Label>
                    <Select onValueChange={(value) => {
                      setFrom(value);
                      const account = accounts.find(acc => acc._id === value);
                      setFromLabel(account ? account.name : '');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="select account" />
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
                )}
                {source && source !== "account" && 
                  renderSourceDestinationSearch(
                    source, 
                    fromLabel, 
                    setFromLabel, 
                    setFrom,
                    dialogOpen, 
                    setDialogOpen
                  )
                }
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination" 
                    type="text"
                    value={destination}
                    readOnly
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Select onValueChange={(value) => {
                    setTo(value);
                    const account = accounts.find(acc => acc._id === value);
                    setToLabel(account ? account.name : '');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="select account" />
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
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={currency}
                    onValueChange={(value) => setCurrency(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount</Label>
                  <Input
                    id="deposit-amount"
                    placeholder="Enter amount"
                    type="text"
                    value={formatPesa(amount)}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(numericValue);
                    }}
                    required
                  />
                </div>
                  <div className="space-y-2">
                    <Label htmlFor="exchange-rate">Exchange Rate </Label>
                    <Input
                      id="exchange-rate"
                      placeholder="Enter exchange rate"
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(parseFloat(e.target.value))}
                      required={currency !== 'KES'}
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="date-picker">Transaction Date</Label>
                  <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                    <DialogTrigger asChild>
                      <Button
                        id="date-picker"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-auto p-3 bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
                      <DialogHeader className="px-4 pt-4">
                        <DialogTitle>Calendar</DialogTitle>
                        <DialogDescription>Select the date of the transaction</DialogDescription>
                      </DialogHeader>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setDateOpen(false);
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
                    </DialogContent>
                  </Dialog>
                </div>
                <Button type="submit" className="w-full">Deposit</Button>
              </div>
            </form>
          </TabsContent>
          <TabsContent value="withdraw">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Fill the transaction description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source" 
                    type="text"
                    value={source}
                    readOnly
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from">From</Label>
                  <Select onValueChange={(value) => {
                    setFrom(value);
                    const account = accounts.find(acc => acc._id === value);
                    setFromLabel(account ? account.name : '');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="select account" />
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
                  <Label htmlFor="destination">Destination</Label>
                  <Select 
                    onValueChange={(value) => {
                      setDestination(value);
                      setTo(null);
                      setToLabel(null)
                    }}
                  >
                    <SelectTrigger className="w-[100%]">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {destination === "account" && (
                  <div className="space-y-2">
                    <Label htmlFor="to">To</Label>
                    <Select onValueChange={(value) => {
                      setTo(value);
                      const account = accounts.find(acc => acc._id === value);
                      setToLabel(account ? account.name : '');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="select account" />
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
                )}
                {destination && destination !== "account" && 
                  renderSourceDestinationSearch(
                    destination, 
                    toLabel, 
                    setToLabel, 
                    setTo, 
                    dialogOpen, 
                    setDialogOpen
                  )
                }
                <div className="space-y-2">
                  <Label htmlFor="deposit-amount">Amount</Label>
                  <Input
                    id="deposit-amount"
                    name="amount"
                    type="text"
                    value={formatPesa(amount)}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(numericValue);
                    }}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select 
                    value={currency}
                    onValueChange={(value) => setCurrency(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchange-rate">Exchange Rate</Label>
                  <Input
                    id="exchange-rate"
                    placeholder="Enter exchange rate"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    required={currency !== 'KES'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-picker">Transaction Date</Label>
                  <Dialog open={dateOpen} onOpenChange={setDateOpen}>
                    <DialogTrigger asChild>
                      <Button
                        id="date-picker"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-auto p-3 bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
                      <DialogHeader className="px-4 pt-4">
                        <DialogTitle>Calendar</DialogTitle>
                        <DialogDescription>Select the date of the transaction</DialogDescription>
                      </DialogHeader>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setDateOpen(false);
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
                    </DialogContent>
                  </Dialog>
                </div>
                <Button type="submit" className="w-full">Withdraw</Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
