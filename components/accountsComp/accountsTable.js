import React, { useState, useEffect, use } from 'react';
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CreateAccount from './createAccount';
import { useRouter } from 'next/router';
import useProjectStore from '@/stores/projectStore';
import { formatCurrency } from '@/lib/utils';
import DeleteAccount from './deleteAccount';

export default function AccountsTable() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectId, setProjectId] = useState('');
  const project = useProjectStore(state => state.project);
  const router = useRouter();

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id);
    }
  }, [project]);

  useEffect(() => {
    fetchAccounts();
  }, [projectId]);

  useEffect(() => {
    const filtered = accounts.filter(a =>
      (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.accountNumber && a.accountNumber.includes(searchTerm))
    );
    setFilteredAccounts(filtered);
    setCurrentPage(1);
  }, [accounts, searchTerm]);  

  const fetchAccounts = async () => {
    try {
      const result = await window.electronAPI.mainOperation('getAllAccounts', projectId);
      if (result.success) {
        setAccounts(result.accounts);
        setFilteredAccounts(result.accounts);
      } else {
        console.error('Failed to fetch accounts:', result.error);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const indexOfLastAccount = currentPage * rowsPerPage;
  const indexOfFirstAccount = indexOfLastAccount - rowsPerPage;
  const currentAccounts = (filteredAccounts || []).slice(indexOfFirstAccount, indexOfLastAccount);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-left">Accounts</CardTitle>
            <CardDescription className="text-left">
              Manage your accounts.
            </CardDescription>
          </div>
          <CreateAccount fetchAccounts={fetchAccounts} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-2 w-64"
            />
          </div>
          <Select value={rowsPerPage.toString()} onValueChange={(value) => setRowsPerPage(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Rows per page" />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((value) => (
                <SelectItem key={value} value={value.toString()}>{value} rows</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="text-base">
                <TableHead className="text-left">Name</TableHead>
                <TableHead className="hidden md:table-cell text-left">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentAccounts.map((a) => (
                <TableRow key={a._id} className="text-base">
                  <TableCell className="text-left font-medium">{a.name}</TableCell>
                  <TableCell className={`hidden md:table-cell text-left ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{a.balance >= 0 ? `${a.currency} ${formatCurrency(a.balance)}` : `${a.currency} [-${formatCurrency(Math.abs(a.balance))}]`}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button onClick={() => router.push(`/accounts/${a._id}`)} size="sm" variant="secondary">View</Button>
                    <DeleteAccount accountId={a._id} accountName={a.name} fetchAccounts={fetchAccounts} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="text-base text-muted-foreground">
          Showing <strong>{indexOfFirstAccount + 1}-{Math.min(indexOfLastAccount, filteredAccounts.length)}</strong> of <strong>{filteredAccounts.length}</strong> accounts
        </div>
        <div className="flex gap-2 text-base">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastAccount >= filteredAccounts.length}
          >
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}