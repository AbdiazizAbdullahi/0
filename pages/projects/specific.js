import React, { useEffect, useState } from 'react'
import MetricCard from '@/components/projectsComp/projectMetric'
import BankAccounts from '@/components/projectsComp/accountMetric'
import useProjectStore from '@/stores/projectStore'
import ClientList from '@/components/clientsComp/ClientList'
import SupplierList from '@/components/suppliersComp/SupplierList'
import AgentList from '@/components/agentsComp/AgentList'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { BanknoteIcon, CreditCard, DollarSign, TrendingDown } from 'lucide-react'
import { useRouter } from 'next/router'
import { formatCurrency } from '@/lib/utils' // Add this import if not exists

export default function SpecificProject() {
  const [expenseStat, setExpenseStat] = useState([])
  const [projectId, setProjectId] = useState('')
  const [accounts, setAccounts] = useState([])
  const project = useProjectStore(state => state.project)
  const router = useRouter()

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    if (projectId) {
      fetchExpenseStat()
      fetchAccounts()
    }
  }, [projectId])

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation("getAllAccounts", projectId)
      if (result.success) {
        setAccounts(result.accounts)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchExpenseStat = async () => {
    try {
      const result = await window.electronAPI.mainOperation("getExpenseStats", projectId)
      console.log(result)
      if (result.success) {
        setExpenseStat(result.stats)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const formatExpenseData = (expense) => {
    if (!expense) return 'No data';
    return `${formatCurrency(expense.amount)} - ${expense.description}`
  }

  const colorClasses = [
    "bg-blue-200 border-blue-200 hover:bg-blue-100",
    "bg-purple-200 border-purple-200 hover:bg-purple-100",
    "bg-pink-200 border-pink-200 hover:bg-pink-100",
    "bg-indigo-200 border-indigo-200 hover:bg-indigo-100",
    "bg-teal-200 border-teal-200 hover:bg-teal-100",
    "bg-green-200 border-green-200 hover:bg-green-100",
    "bg-amber-200 border-amber-200 hover:bg-amber-100",
    "bg-rose-200 border-rose-200 hover:bg-rose-100",
    "bg-orange-200 border-orange-200 hover:bg-orange-100",
    "bg-cyan-200 border-cyan-200 hover:bg-cyan-100",
  ]

  return (
    <div className="space-y-4">
      <Card className="w-full shadow-sm">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <BanknoteIcon className="h-6 w-6 text-primary" />
          Bank Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => {
            const colorClass = colorClasses[index % colorClasses.length]
            const balanceColor = account.balance > 0 ? "text-green-600" : "text-red-600"

            return (
              <Card
                key={account._id}
                className={`${colorClass} border transition-all duration-200 cursor-pointer hover:shadow-md`}
                onClick={() => router.push(`/accounts/${account._id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 rounded-full bg-white/80 shadow-sm">
                      <BanknoteIcon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg">{account.name}</h3>
                  </div>

                  <div className="rounded-lg bg-white shadow-sm border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <div className={`flex items-center font-medium ${balanceColor}`}>
                        <span className="text-xl font-bold">
                          {account.balance >= 0 ? `${account.currency} ${formatCurrency(account.balance)}` : `${account.currency} [-${formatCurrency(Math.abs(account.balance))}]`}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>

      {expenseStat && (
        <Card onClick={() => router.push('/expenses')}>
          <CardHeader>
            <CardTitle>Expenses Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {['Total Expenses', 'Last Month Expenses', 'Latest Expense'].map((title, index) => {
              const colors = ['bg-indigo-300', 'bg-teal-300', 'bg-green-300', 'bg-yellow-300', 'bg-red-300', 'bg-orange-300', 'bg-cyan-300'];
              const color = colors[index % colors.length];
              return (
                <Card key={title} className={`${color} z-0`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {title === 'Total Expenses' && <DollarSign className="h-4 w-4" />}
                    {title === 'Last Month Expenses' && <TrendingDown className="h-4 w-4" />}
                    {title === 'Latest Expense' && <CreditCard className="h-4 w-4" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {title === 'Latest Expense' && expenseStat.latestExpense ? (
                        <>
                          <div className="text-xl font-bold">
                            {expenseStat.latestExpense.currency} {formatCurrency(expenseStat.latestExpense.amount)}
                          </div>
                          <div className="text-sm truncate">
                            {expenseStat.latestExpense.description}
                          </div>
                        </>
                      ) : (
                        `KES ${formatCurrency(
                          title === 'Total Expenses' ? expenseStat.totalExpenses || 0 :
                          title === 'Last Month Expenses' ? expenseStat.lastMonthExpenses || 0 : 0
                        )}`
                      )}
                    </div>
                    <p className="text-xs">
                      {title === 'Total Expenses' && 'Overall spending'}
                      {title === 'Last Month Expenses' && 'Previous month total'}
                      {title === 'Latest Expense' && 'Most recent transaction'}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex space-x-4">
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full h-12 grid-cols-3 bg-blue-100 p-1">
            <TabsTrigger value="clients" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-md font-bold">
              Clients
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-md font-bold">
              Suppliers
            </TabsTrigger>
            <TabsTrigger value="agents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-md font-bold">
              Agents
            </TabsTrigger>
          </TabsList>
          <TabsContent value="clients">
            <ClientList />
          </TabsContent>
          <TabsContent value="suppliers">
            <SupplierList />
          </TabsContent>
          <TabsContent value="agents">
            <AgentList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
