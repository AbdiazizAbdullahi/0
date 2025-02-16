"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddTransaction } from "./AddTransaction"

export function TransactionList() {
  const [transactions, setTransactions] = useState([])

  const fetchTransactions = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllTransactions')
      if (response.success) {
        console.log(response)
        setTransactions(response.transactions)
      } else {
        console.error('Failed to fetch transactions:', response.error)
        setTransactions([])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setTransactions([])
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleTransactionAdded = (newTransaction) => {
    setTransactions([...transactions, newTransaction])
  }

  const handleDelete = async (transactionId) => {
    try {
      const response = await window.electronAPI.mainOperation('deleteTransaction', { id: transactionId })
      if (response.success) {
        setTransactions(transactions.filter(t => t._id !== transactionId))
      } else {
        console.error('Failed to delete transaction:', response.error)
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddTransaction onTransactionAdded={handleTransactionAdded} />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Destination</TableHead>
            {/* <TableHead>Actions</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions && transactions.length > 0 ? (
            transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{transaction.transType}</TableCell>
                <TableCell>{transaction.amount}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                <TableCell>{transaction.source}</TableCell>
                <TableCell>{transaction.destination}</TableCell>
                {/* <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDelete(transaction._id)}
                  >
                    Delete
                  </Button>
                </TableCell> */}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
