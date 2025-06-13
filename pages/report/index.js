import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import useProjectStore from '@/stores/projectStore';
import { ArrowUpDown, RefreshCw, DollarSign, CreditCard, BarChart3 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from '@/lib/utils';

export default function Report() {
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const project = useProjectStore(state => state.project);
  const [projectId, setProjectId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [totals, setTotals] = useState({
    totalDebit: 0,
    cost: 0,
    totalExpenses: 0,
    totalCredit: 0,
    balance: 0
  });
  const [totalAmountPaid, setTotalAmountPaid] = useState(0);

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id);
    }
  }, [project]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchIncomeStatement();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getValueColor = (value) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const fetchIncomeStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.mainOperation('generateIncomeStatement', projectId);
      if (result.success) {
        setIncomeStatement(result.incomeStatement);
        setTotals(result.totals);
        setTotalAmountPaid(result.totalAmountPaid || 0);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchIncomeStatement();
    }
  }, [projectId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="w-full p-6 bg-white rounded-lg border border-gray-100">
        <h2 className="text-xl font-bold mb-4">Income Statement Overview</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Debit Card */}
          <Card className="bg-blue-100 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-blue-700">Total Debit</p>
                  <h3 className="text-2xl font-bold text-blue-900">KES {formatCurrency(totals?.totalDebit || 0)}</h3>
                  <p className="text-xs text-blue-700">Incoming funds</p>
                </div>
                <div className="bg-blue-200 p-2 rounded-md">
                  <DollarSign className="h-5 w-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Amount Paid Card */}
          <Card className="bg-yellow-100 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-yellow-700">Total Paid</p>
                  <h3 className="text-2xl font-bold text-yellow-900">KES {formatCurrency(totalAmountPaid || 0)}</h3>
                  <p className="text-xs text-yellow-700">From customers</p>
                </div>
                <div className="bg-yellow-200 p-2 rounded-md">
                  <DollarSign className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Credit Card */}
          <Card className="bg-purple-100 border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-purple-700">Total Credit</p>
                  <h3 className="text-2xl font-bold text-purple-900">
                    KES {formatCurrency(totals?.totalCredit || 0)}
                  </h3>
                  <p className="text-xs text-purple-700">Outgoing funds</p>
                </div>
                <div className="bg-purple-200 p-2 rounded-md">
                  <CreditCard className="h-5 w-5 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Balance Card */}
          <Card className={totals?.balance >= 0 ? "bg-green-100" : "bg-red-100"} border-0 overflow-hidden>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className={`text-sm text-${totals?.balance >= 0 ? "green" : "red"}-600`}>Balance</p>
                  <h3 className={`text-2xl text-${totals?.balance >= 0 ? "green" : "red"}-600 font-bold`}>{(totals?.balance || 0) >= 0 ? `KES ${formatCurrency(totals?.balance || 0)}` : `KES [-${formatCurrency(Math.abs(totals?.balance || 0))}]`}</h3>
                  <p className={`text-xs text-${totals?.balance >= 0 ? "green" : "red"}-600`}>Net balance</p>
                </div>
                <div className={`bg-${totals?.balance >= 0 ? "green" : "red"}-600 p-2 rounded-md`}>
                  <BarChart3 className={`h-5 w-5 text-${totals?.balance >= 0 ? "green" : "red"}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="shadow-sm transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold">Income Statement</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Financial summary for {project?.name || "this project"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60%]">Category</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => router.push('/sales')}>
                  <TableCell className="font-medium">Revenue</TableCell>
                  <TableCell className={`text-right ${getValueColor(incomeStatement?.revenue || 0)}`}>
                    {(incomeStatement?.revenue || 0) >= 0 ? formatCurrency(incomeStatement?.revenue || 0) : `[-${formatCurrency(Math.abs(incomeStatement?.revenue || 0))}]`}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => router.push('/invoices')}>
                  <TableCell className="font-medium">Cost</TableCell>
                  <TableCell className="text-right">{formatCurrency(incomeStatement?.cost || 0)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 hover:bg-muted/30">
                  <TableCell className="font-medium">Gross Profit</TableCell>
                  <TableCell className={`text-right font-medium ${getValueColor(incomeStatement?.grossProfit || 0)}`}>
                    {(incomeStatement?.grossProfit || 0) >= 0 ? formatCurrency(incomeStatement?.grossProfit || 0) : `[-${formatCurrency(Math.abs(incomeStatement?.grossProfit || 0))}]`}
                  </TableCell>
                </TableRow>
                <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={() => router.push('/expenses')}>
                  <TableCell className="font-medium">Expenses</TableCell>
                  <TableCell className="text-right">{formatCurrency(incomeStatement?.expenses || 0)}</TableCell>
                </TableRow>
                <TableRow className="border-t-2 bg-muted/20 hover:bg-muted/30">
                  <TableCell className="text-base font-semibold">Net Profit</TableCell>
                  <TableCell
                    className={`text-right text-base font-semibold ${getValueColor(incomeStatement?.netProfit || 0)}`}
                  >
                    {(incomeStatement?.netProfit || 0) >= 0 ? formatCurrency(incomeStatement?.netProfit || 0) : `[-${formatCurrency(Math.abs(incomeStatement?.netProfit || 0))}]`}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
