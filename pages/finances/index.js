"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/transactionsComp/TransactionList"
import AccountsTable from "@/components/accountsComp/accountsTable"

export default function Finances() {
  return (
    <Tabs defaultValue="accounts" className="w-full max-w-4xl mx-auto">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="accounts">Accounts</TabsTrigger>
        <TabsTrigger value="transactions">Transactions</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
      </TabsList>
      <TabsContent value="accounts">
          <AccountsTable />
      </TabsContent>
      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>View and manage your recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionList />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="expenses">
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
            <CardDescription>Track and categorize your expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your expense categories and summaries will be displayed here.</p>
            {/* Add expense charts or breakdowns here */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

