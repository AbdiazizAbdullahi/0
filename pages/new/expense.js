import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useProjectStore from '@/stores/projectStore'

export default function NewExpense() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    accountId: '',
    accountName: ''
  })
  const [accounts, setAccounts] = useState([])
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore(state => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    fetchAccounts()
  }, [projectId])

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
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        accountId: formData.accountId,
        accountName: formData.accountName,
        projectId: projectId
      }
      const response = await window.electronAPI.mainOperation('createExpense', payload)
      console.log(response)
      if (response.success) {
        router.push('/expenses')
      }
    } catch (error) {
      console.error('Failed to create expense:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Expense</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Date</Label>
          <Input
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label>Amount</Label>
          <Input
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="account">Account</Label>
          <Select onValueChange={(value) => {
            const account = accounts.find(acc => acc._id === value);
            setFormData(prev => ({
              ...prev,
              accountId: account._id,
              accountName: account.name
            }))
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
        <Button as="button" type="submit" disabled={isSubmitting}>
          Create Expense
        </Button>
      </form>
    </div>
  )
}
