import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BanknoteIcon as Bank, CreditCard, DollarSign } from "lucide-react"

export default function BankAccounts() {
  return (
    <Card className="w-full">
      <CardHeader className="py-2" >
        <CardTitle className="text-2xl font-bold">Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background z-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Bank className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{account.bankName}</h3>
                </div>
                <div className="flex items-center space-x-2 text-lg font-bold">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span>{account.balance.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

