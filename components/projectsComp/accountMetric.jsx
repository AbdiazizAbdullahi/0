import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BanknoteIcon as Bank, CreditCard, DollarSign } from "lucide-react"

const bankAccounts = [
  { id: "1", bankName: "Chase Bank", accountNumber: "****1234", balance: 5000.0 },
  { id: "2", bankName: "Bank of America", accountNumber: "****5678", balance: 7500.5 },
  { id: "3", bankName: "Wells Fargo", accountNumber: "****9012", balance: 3200.75 },
]

export default function BankAccounts() {
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="py-2" >
        <CardTitle className="text-2xl font-bold">Project Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
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

