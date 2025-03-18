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

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="py-2" >
          <CardTitle className="text-2xl font-bold">Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account, index) => {
              const colors = ['from-blue-400', 'from-purple-400', 'from-pink-400', 'from-indigo-400', 'from-teal-400', 'from-green-400', 'from-yellow-400', 'from-red-400', 'from-orange-400', 'from-cyan-400'];
              const color = colors[index % colors.length];
              const balanceColor = account.balance > 0 ? 'text-green-500' : 'text-red-500';
              return (
                <Card key={account._id} className={`inset-0 bg-gradient-to-br ${color} to-background z-0`} onClick={() => router.push(`/accounts/${account._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BanknoteIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{account.name}</h3>
                    </div>
                    <div className="flex bg-gray-100 rounded-md border border-cyan-500 items-center space-x-2 text-lg font-bold">
                      <DollarSign className={`h-5 w-5 ${balanceColor}`} />
                      <span className={balanceColor}>{account.currency} {formatCurrency(Math.abs(account.balance))}</span>
                    </div>
                  </CardContent>
                </Card>
              );
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
              const colors = ['from-indigo-400', 'from-teal-400', 'from-green-400', 'from-yellow-400', 'from-red-400', 'from-orange-400', 'from-cyan-400'];
              const color = colors[index % colors.length];
              return (
                <Card key={title} className={`inset-0 bg-gradient-to-br ${color} to-background z-0`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {title === 'Total Expenses' && <DollarSign className="h-4 w-4 text-muted-foreground" />}
                    {title === 'Last Month Expenses' && <TrendingDown className="h-4 w-4 text-muted-foreground" />}
                    {title === 'Latest Expense' && <CreditCard className="h-4 w-4 text-muted-foreground" />}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {title === 'Latest Expense' && expenseStat.latestExpense ? (
                        <>
                          <div className="text-xl font-bold">
                            {expenseStat.latestExpense.currency} {formatCurrency(expenseStat.latestExpense.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
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
                    <p className="text-xs text-muted-foreground">
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
