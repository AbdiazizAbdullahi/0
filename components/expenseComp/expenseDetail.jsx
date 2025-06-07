import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "../ui/label"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "../ui/separator"
import { Button } from "@/components/ui/button" // Added
import { Download } from "lucide-react" // Added

export default function ExpenseDetails({ expense, isOpen, onClose }) {
  const handleDownloadPdf = () => {
    if (expense && expense.pdfBase64) {
      try {
        const base64Data = expense.pdfBase64.split(';base64,').pop();
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expense-${expense.description || 'details'}.pdf`; // Use description for filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error("Error downloading PDF:", error);
        alert("Failed to download PDF. The file may be corrupted or an error occurred.");
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <div className="flex justify-between items-center">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">Expense Details</SheetTitle>
          </SheetHeader>
        </div>

        <div className="mt-6 space-y-6">
          {/* Header section with key information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Expense Type</h3>
                <p className="font-bold text-lg">{expense.expenseType}</p>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="font-medium text-sm text-muted-foreground">Date</h3>
              <p>{new Date(expense.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
          </div>

          <Separator />

          {/* Account information */}
          <div>
            <h3 className="font-semibold mb-2">Account</h3>
            <div className="bg-background border rounded-md p-4">
              <p className="font-medium">{expense.accountName}</p>
            </div>
          </div>

          {/* Expense details */}
          <div>
            <h3 className="font-semibold mb-2">Details</h3>
            <div className="bg-background border rounded-md p-4 space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{expense.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="mt-1 font-semibold text-lg">
                    {expense.currency} {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Exchange Rate</Label>
                  <p className="mt-1">{expense.rate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {(expense && expense.pdfBase64 && expense.pdfBase64.startsWith('data:application/pdf;base64,')) && (
            <div className="flex space-x-2 pt-4">
              <Button className="flex-1" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
