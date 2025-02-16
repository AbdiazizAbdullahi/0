"use client"

import { useState } from "react"
import { ArrowRight, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"

export default function MetricCard({
  title = "Income Statement",
  link = "/",
  amount = 366980,
  subtitle = "Total Sales for the Selected Period",
  currency = "KES"
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Card
      className="w-full max-w-md overflow-hidden cursor-pointer group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background z-0" />
      <div className="relative z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h3 className="text-lg font-medium text-primary">{title}</h3>
          <Link href={link} >
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-2">
            <DollarSign className="h-8 w-8 text-primary" />
            <span className="text-3xl font-bold tracking-tight">
              {currency} {amount.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </CardContent>
      </div>
    </Card>
  )
}

