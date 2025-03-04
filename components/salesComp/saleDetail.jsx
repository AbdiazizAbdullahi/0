import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "../ui/label"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "../ui/separator"

export default function SaleDetails({ sale, isOpen, onClose }) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <div className="flex justify-between items-center">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">Sale Details</SheetTitle>
          </SheetHeader>
        </div>

        <div className="mt-6 space-y-6">
          {/* Header section with key information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Unit Number</h3>
                <p className="font-bold text-lg">{sale.houseNo}</p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-sm text-muted-foreground">Date</h3>
              <p>{new Date(sale.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          <Separator />

          {/* Client information */}
          <div>
            <h3 className="font-semibold mb-2">Client</h3>
            <div className="bg-background border rounded-md p-4">
              <p className="font-medium">{sale.clientName}</p>
            </div>
          </div>

          {/* Sale details */}
          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="bg-background border rounded-md p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="mt-1 font-semibold text-lg">
                    {sale.currency} {formatCurrency(sale.price)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Exchange Rate</Label>
                  <p className="mt-1">{sale.rate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
