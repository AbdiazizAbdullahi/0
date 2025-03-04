import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "../ui/label"
import { formatCurrency } from "@/lib/utils"
import { Button } from "../ui/button"
import { Download, Printer, X } from "lucide-react"
import { Separator } from "../ui/separator"
import { Badge } from "../ui/badge"

export default function InvoiceDetails({ invoice, isOpen, onClose }) {
return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <div className="flex justify-between items-center">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">Invoice Details</SheetTitle>
          </SheetHeader>
        </div>

        <div className="mt-6 space-y-6">
          {/* Header section with key information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Invoice Number</h3>
                <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-sm text-muted-foreground">Date</h3>
              <p>{new Date(invoice.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          <Separator />

          {/* Supplier information */}
          <div>
            <h3 className="font-semibold mb-2">Supplier</h3>
            <div className="bg-background border rounded-md p-4">
              <p className="font-medium">{invoice.supplierName}</p>
            </div>
          </div>

          {/* Invoice details */}
          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="bg-background border rounded-md p-4 space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{invoice.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="mt-1 font-semibold text-lg">
                    {invoice.currency} {formatCurrency(invoice.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Exchange Rate</Label>
                  <p className="mt-1">{invoice.rate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {/* <div className="flex space-x-2 pt-4">
            <Button className="flex-1" variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div> */}
        </div>
      </SheetContent>
    </Sheet>
)
}
