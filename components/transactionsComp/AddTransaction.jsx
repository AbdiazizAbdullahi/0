"use client"

import React, { useEffect, useState } from 'react'
import useProjectStore from '@/stores/projectStore';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown, Search, X } from 'lucide-react'

export function AddTransaction({ onTransactionAdded }) {
  const [amount, setAmount] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const [rate, setRate] = useState(1);
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    setProjectId(project._id);
  }, [project]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation('getAllAccounts');
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
      const searchResult = await window.electronAPI.searchCS(searchTerm, type.toLowerCase());
      if (searchResult.success) {
        setSearchResult(searchResult.result);
      }
    } catch (error) {
      console.error('Error during search:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm && transType === "deposit") {
        performSearch(searchTerm, source);
      } else if (searchTerm && transType === "withdraw") {
        performSearch(searchTerm, destination);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
      console.log('transData:', transData);

      // const result = await window.electronAPI.mainOperation('createTransaction', transData);
      // if (result.success) {
      //   if (onTransactionAdded) {
      //     onTransactionAdded(transData);
      //   }
        
      //   // Reset form
      //   setAmount(0);
      //   setDescription("");
      //   setSource(null);
      //   setDestination("account");
      //   setFrom(null);
      //   setTo(null);
      //   setDate(() => new Date());
      //   setFromLabel("");
      //   setToLabel("");
      //   setSearchTerm("");
      //   setSearchResult([]);
      //   setOpen(false);
      //   setProjectId(null);
      // } else {
      //   throw new Error(result.error || 'Failed to create transaction');
      // }
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
      <Label htmlFor={`${type}-select`}>To</Label>
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
    <div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">Add Transaction</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <ScrollArea className="h-full pr-4">
            <SheetHeader>
              <SheetTitle>Transaction Recording</SheetTitle>
              <SheetDescription>Manage your account balance</SheetDescription>
            </SheetHeader>

            {alert.show && (
              <Alert variant={alert.type}>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            )}

            <div className="mt-6">
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
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
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
                          <DialogContent className="w-auto">
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
                              className="p-4"
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
                          placeholder="Enter amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
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
                          <DialogContent className="w-auto">
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
                              className="p-4"
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Button type="submit" className="w-full">Withdraw</Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              Please ensure you have sufficient funds for withdrawals.
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
