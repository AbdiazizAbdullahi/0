"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/transactionsComp/TransactionList"
import AccountsTable from "@/components/accountsComp/accountsTable"

export default function Finances() {
  return (
    <div>
        <AccountsTable />
    </div>  
  )
}

