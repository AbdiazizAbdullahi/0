"use client"

import React from 'react'
import { Dialog } from "@/components/ui/dialog"
import SalesForm from './SalesForm'

export default function SalesModal({ sale, onClose, onUpdate }) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <SalesForm 
        sale={sale} 
        onClose={onClose}
        onUpdate={onUpdate}
      />
    </Dialog>
  )
}