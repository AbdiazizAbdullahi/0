"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import AgentList from "@/components/agentsComp/AgentList"
import AgentModal from "@/components/agentsComp/AgentModal"

export default function Agents() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-muted-foreground">Manage your agents network.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)}>Add Agent</Button>
        </div>
      </div>

      <AgentList refreshTrigger={refreshTrigger} />

      {isModalOpen && (
        <AgentModal 
          onClose={() => setIsModalOpen(false)}
          onUpdate={() => {
            setIsModalOpen(false)
            setRefreshTrigger(prev => prev + 1) // Trigger refresh
          }}
        />
      )}
    </div>
  )
}
