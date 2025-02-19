"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Phone, DollarSign, CreditCard, Wallet } from "lucide-react"
import { format } from "date-fns"

export default function SupplierDetail() {
  const router = useRouter()
  const { id } = router.query

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      style: "decimal",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-xl sm:text-2xl">Supplier Detail</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 bg-red-50 rounded-md">{error}</div>
          ) : (
            <>
              <section className="mb-8 p-4 sm:p-6 bg-gray-50 rounded-lg shadow-inner">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary">Supplier Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{data.info.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium break-all">{data.info.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{data.info.phoneNumber}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary">Financial Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="bg-blue-50 hover:bg-blue-100 transition-colors">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Debit</p>
                          <p className="text-lg sm:text-2xl font-bold text-blue-600">
                            {formatCurrency(data.metrics.totalDebit)}
                          </p>
                        </div>
                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 hover:bg-green-100 transition-colors">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Total Credit</p>
                          <p className="text-lg sm:text-2xl font-bold text-green-600">
                            {formatCurrency(data.metrics.totalCredit)}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 hover:bg-orange-100 transition-colors">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Balance</p>
                          <p className="text-lg sm:text-2xl font-bold text-orange-600">
                            {formatCurrency(data.metrics.difference)}
                          </p>
                        </div>
                        <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-primary">Transactions Ledger</h2>
                <div className="overflow-x-auto shadow rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.ledger.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {entry.description}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-500">
                            {entry.debit ? formatCurrency(entry.debit) : "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-500">
                            {entry.credit ? formatCurrency(entry.credit) : "-"}
                          </td>
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-right font-medium text-gray-900">
                            {formatCurrency(entry.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

