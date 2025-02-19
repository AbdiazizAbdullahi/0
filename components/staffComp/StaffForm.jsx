"use client"

import { useState, useEffect } from "react"
import useProjectStore from "@/stores/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"

export default function StaffForm({ initialData = {}, onSubmit, mode = "create" }) {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    projectId: "",
    ...initialData,
  })
  const [projectId, setProjectId] = useState("")
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }))
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const roles = ["Director", "Admin", "Accountant", "Worker"]

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add New Staff" : "Update Staff Information"}</CardTitle>
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
              placeholder="Enter staff's full name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              name="role"
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value,
                }))
              }
              required
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            {mode === "create" ? "Add Staff" : "Update Staff"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

