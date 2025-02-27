"use client"

import { useState, useEffect, use } from "react"
import useProjectStore from "@/stores/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function SupplierForm({ supplier, onSubmit, mode = "create" }) {
  const [formData, setFormData] = useState({
    name: "",
    balance: 0,
    projectId: "",
    currency: 'KES',
    ...supplier,
  })
  const [projectId, setProjectId] = useState("")
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    if (supplier) {
      setFormData((prev) => ({
        ...prev,
        ...supplier,
      }))
    }
  }, [supplier])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log({ ...formData, projectId })
    onSubmit({ ...formData, projectId })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add New Supplier" : "Update Supplier Information"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter supplier's full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              name="currency"
              value={formData.currency}
              onValueChange={(value) => handleChange({ target: { name: 'currency', value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KES">KES</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            {mode === "create" ? "Add Supplier" : "Update Supplier"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}