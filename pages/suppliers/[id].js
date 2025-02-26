"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, CreditCard, Wallet, AlertCircle, Download, Info } from "lucide-react"
import { format } from "date-fns"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function SupplierDetail() {
  const params = useParams()
  const id = params?.id

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rowsPerPage, setRowsPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await window.electronAPI.mainOperation("getSupplierDetails", id)
        if (response.success) {
          setData(response.data)
        } else {
          throw new Error(response.error || "Failed to fetch supplier details")
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totalPages = data?.ledger ? Math.ceil(data.ledger.length / parseInt(rowsPerPage)) : 0
  const startIndex = (currentPage - 1) * parseInt(rowsPerPage)
  const endIndex = startIndex + parseInt(rowsPerPage)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value)
    setCurrentPage(1)
  }

  const filteredData = data?.ledger ? data.ledger.filter(entry =>
    entry.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  const exportToCSV = () => {
    if (!data?.ledger) return

    const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance']
    const csvData = filteredData.map(entry => [
      format(new Date(entry.date), "yyyy-MM-dd"),
      entry.description,
      entry.debit || '',
      entry.credit || '',
      entry.balance
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.href = url
    link.setAttribute('download', `supplier_${id}_ledger.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = async () => {
    try {
      const response = await window.electronAPI.mainOperation("supplierPDF", {
        data: filteredData,
        supplier: data.info.name,
        totals: data.metrics
      })
      
      if (!response.success) {
        throw new Error(response.error)
      }
    } catch (err) {
      console.error("PDF export failed:", err)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const isBalanced = data?.info?.balance === data?.metrics?.difference
  const showAlert = !loading && data?.info && data?.metrics

  return (
    <div className="space-y-8">
      <div className="flex justify-between mt-4">
        <div>
          {loading ? <Skeleton className="h-8 w-48" /> : <h1 className="text-3xl font-bold">{data?.info.name}</h1>}
        </div>
        <div className="flex items-center mr-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Balance Information">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="p-4">
                {loading ? (
                  <Skeleton className="h-16 w-full" />
                ) : showAlert ? (
                  <Alert variant={isBalanced ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{isBalanced ? "Balance Accurate" : "Discrepancy Detected"}</AlertTitle>
                    <AlertDescription>
                      {isBalanced
                        ? "The balance is accurate and balanced."
                        : `The balance is not accurate and needs revision. ${data.info.name} balance is ${formatCurrency(data.info.balance)} while the ledger balance is ${formatCurrency(data.metrics.difference)}.`}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-sm text-muted-foreground">No balance information available.</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-primary">Financial Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FinancialCard
            title="Total Debit"
            amount={data?.metrics.totalDebit}
            icon={<CreditCard className="h-6 w-6 text-blue-500" />}
            loading={loading}
            color="blue"
          />
          <FinancialCard
            title="Total Credit"
            amount={data?.metrics.totalCredit}
            icon={<DollarSign className="h-6 w-6 text-orange-500" />}
            loading={loading}
            color="orange"
          />
          <FinancialCard
            title="Balance"
            amount={data?.metrics.difference}
            icon={<Wallet className={`h-6 w-6 ${data?.metrics.difference > 0 ? "text-red-500" : "text-green-500"}`} />}
            loading={loading}
            color={data?.metrics.difference > 0 ? "red" : "green"}
          />
        </div>
      </section>

      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <div>
            <CardTitle className="text-2xl font-bold">Transactions Ledger</CardTitle>
            <p className="text-sm text-muted-foreground">View all sales for this project</p>
          </div>
          <div className="flex items-center space-x-4">
            <Input 
              placeholder="Search by description" 
              className="w-[250px]" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV}>
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px] font-medium">Date</TableHead>
                    <TableHead className="font-medium">Description</TableHead>
                    <TableHead className="text-right font-medium">Debit</TableHead>
                    <TableHead className="text-right font-medium">Credit</TableHead>
                    <TableHead className="text-right font-medium">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData
                    .slice(startIndex, endIndex)
                    .map((entry, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.debit ? `${entry.currency} ${formatCurrency(entry.debit)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.credit ? `${entry.currency} ${formatCurrency(entry.credit)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(Math.abs(entry.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
            </p>
            <div className="flex items-center space-x-6">
              <Select value={rowsPerPage} onValueChange={handleRowsPerPageChange}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 rows</SelectItem>
                  <SelectItem value="20">20 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FinancialCard({ title, amount, icon, loading, color }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className={`bg-${color}-50 hover:bg-${color}-100 transition-colors`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className={`text-2xl font-bold text-${color}-600`}>{formatCurrency(Math.abs(amount))}</p>
            )}
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

