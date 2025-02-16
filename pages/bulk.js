"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClientsData from "@/components/bulkComps/clientsData"
import InvoicesData from "@/components/bulkComps/invoicesData"
import TransactionsData from "@/components/bulkComps/transactionsData"
import ExpensesData from "@/components/bulkComps/expensesData"

export default function Bulk() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bulk Data Loading</h1>
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="clients">
          <ClientsData />
        </TabsContent>
        <TabsContent value="invoices">
          <InvoicesData />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsData />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesData />
        </TabsContent>
      </Tabs>
    </div>
  )
}