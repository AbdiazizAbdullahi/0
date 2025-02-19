import React, { useState, useEffect } from 'react'
import useProjectStore from '@/stores/projectStore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/router'

export default function NewInvoice() {
  const router = useRouter()
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
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore(state => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    fetchSuppliers()
  }, [projectId])

  const fetchSuppliers = async () => {
    try {
      const response = await window.electronAPI.mainOperation('getAllSuppliers', projectId)
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

  const handleSupplierChange = (supplierId) => {
    const selectedSupplier = suppliers.find(s => s._id === supplierId);
    if (selectedSupplier) {
      setFormData(prev => ({
        ...prev,
        supplierId: selectedSupplier._id,
        supplierName: selectedSupplier.name || ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isSubmitting) return
    setIsSubmitting(true)
    
    try {
      const payload = {
        invoiceNumber: formData.invoiceNumber,
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        projectId: projectId,
        amount: parseFloat(formData.amount),
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        date: formData.date,
        description: formData.description
      }
      
      console.log('payload:', payload)
      const response = await window.electronAPI.mainOperation('createInvoice', payload)
      if (response.success) {
        router.push('/invoices')
      }
    } catch (error) {
      console.error('Failed to create invoice:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Invoice</h1>
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
        
        <div>
          <Label>Quantity</Label>
          <Input
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <Label>Price per Unit</Label>
          <Input
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
          />
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          Create Invoice
        </Button>
      </form>
    </div>
  )
}
