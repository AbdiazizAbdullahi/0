"use client"

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogFooter } from "@/components/ui/dialog"
import useProjectStore from '@/stores/projectStore'

export default function AgentForm({ onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    balance: initialData?.balance || 0,
  })
  const [projectId, setProjectId] = useState('')
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        projectId,
        ...(initialData && { _id: initialData._id })
      }
      await onSubmit(payload)
    } catch (error) {
      console.error('Error submitting agent form:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input 
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="col-span-3"
          required
          placeholder="Enter agent name"
        />
      </div>
      <DialogFooter>
        <Button type="submit">
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}