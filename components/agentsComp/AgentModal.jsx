"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import AgentForm from './AgentForm'

export default function AgentModal({ agent, onClose, onUpdate }) {
  const handleSubmit = async (formData) => {
    try {
      const operation = agent ? 'updateAgent' : 'createAgent'
      const response = await window.electronAPI.mainOperation(operation, formData)
      
      if (response.success) {
        onUpdate()
        onClose()
      } else {
        console.error('Failed to save agent:', response.error)
      }
    } catch (error) {
      console.error('Error saving agent:', error)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{agent ? 'Edit Agent' : 'Add New Agent'}</DialogTitle>
          <DialogDescription>
            {agent ? 'Update the details of this agent.' : 'Create a new agent in your network.'}
          </DialogDescription>
        </DialogHeader>
        
        <AgentForm 
          onSubmit={handleSubmit} 
          initialData={agent} 
        />
      </DialogContent>
    </Dialog>
  )
}