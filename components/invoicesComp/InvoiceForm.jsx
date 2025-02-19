import React, { useState, useEffect } from 'react'
import useProjectStore from '@/stores/projectStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InvoiceForm({ invoice, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    supplierId: '',
    supplierName: '',
    projectId: '',
    amount: '',
    quantity: '',
    price: '',
    date: '',
    description: ''
  })
  const [suppliers, setSuppliers] = useState([])
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    fetchSuppliers()
    fetchProjects()
    
    if (invoice) {
      setFormData({
        invoiceNumber: invoice.invoiceNumber || '',
        supplierId: invoice.supplierId || '',
        supplierName: invoice.supplierName || '',
        projectId: invoice.projectId || '',
        totalAmount: invoice.totalAmount || '',
        date: invoice.date ? new Date(invoice.date).toISOString().split('T')[0] : '',
        description: invoice.description || ''
      })
    }
  }, [invoice])

  const fetchSuppliers = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllSuppliers')
      if (response.success) {
        setSuppliers(response.suppliers)
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSupplierChange = (value) => {
    setFormData(prev => ({
      ...prev,
      supplierId: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const payload = {
        ...(invoice ? { _id: invoice._id } : {}),
        invoiceNumber: formData.invoiceNumber,
        supplierId: formData.supplierId,
        projectId: formData.projectId,
        amount: parseFloat(formData.totalAmount),
        date: formData.date,
        description: formData.description
      }
      
      await onSubmit(payload)
    } catch (error) {
      console.error(`Failed to ${invoice ? 'update' : 'create'} invoice:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Invoice Number</Label>
        <Input
          name="invoiceNumber"
          value={formData.invoiceNumber}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <Label>Supplier</Label>
        <Select
          value={formData.supplierId}
          onValueChange={handleSupplierChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map(supplier => (
              <SelectItem key={supplier._id} value={supplier._id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      
      <Button type="submit" disabled={isSubmitting}>
        {invoice ? 'Update Invoice' : 'Create Invoice'}
      </Button>
    </form>
  )
}
