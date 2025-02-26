"use client"

import { forwardRef } from "react"
import { Plus, ShoppingCart, Receipt, FileText, CreditCard } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const menuItems = [
  { label: "New Sale", icon: ShoppingCart, link: "/new/sale", description: "Create a new sale record" },
  { label: "New Transaction", icon: Receipt, link: "/new/transaction", description: "Record a new transaction" },
  { label: "New Invoice", icon: FileText, link: "/new/invoice", description: "Generate a new invoice" },
  { label: "New Expense", icon: CreditCard, link: "/new/expense", description: "Log a new expense" },
]

export const NewITES = forwardRef((props, ref) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
                <Button
                  ref={ref}
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 rounded-md transition-all hover:bg-secondary hover:text-secondary-foreground"
                  aria-label="Create new item"
                >
                <Plus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="end">
              <div className="flex flex-col gap-1">
                {menuItems.map((item) => (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-left" asChild>
                        <Link href={item.link}>
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent>
          <p>Create new item</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

NewITES.displayName = 'NewITES'
