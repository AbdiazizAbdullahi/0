"use client"

import { useState, useEffect } from "react"
import useProjectStore from "@/stores/projectStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function ClientForm({ client, onSubmit, mode = "create" }) {
  const [formData, setFormData] = useState({
    name: "",
    balance: 0,
    projectId: '',
    ...client,
  })
  const [projectId, setProjectId] = useState("")
  const project = useProjectStore((state) => state.project)

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])

  useEffect(() => {
    if (client) {
      setFormData((prev) => ({
        ...prev,
        ...client,
      }))
    }
  }, [client])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ ...formData, projectId })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Add New Client" : "Update Client Information"}</CardTitle>
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
              placeholder="Enter client's full name"
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">
            {mode === "create" ? "Add Client" : "Update Client"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}