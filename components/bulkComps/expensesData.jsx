import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseFile, validateData } from '@/lib/bulkImportUtils';
import { toast } from 'sonner';
import useProjectStore from '@/stores/projectStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function ExpensesData() {
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState('');
  const project = useProjectStore(state => state.project);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id);
    }
  }, [project]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await window.electronAPI.mainOperation('getAllAccounts', projectId);
        if (response.success) {
          setAccounts(response.accounts);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        toast.error('Failed to fetch accounts');
      }
    }

    if (projectId) {
      fetchAccounts();
    }
  }, [projectId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const jsonData = await parseFile(file);
      setParsedData(jsonData);
      
      // Validate data
      const validated = validateData.expenses(jsonData);
      setValidatedData(validated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    // Filter only valid entries
    const validEntries = validatedData.filter(entry => entry.isValid);
    
    if (validEntries.length === 0) {
      toast.error('No valid entries to submit');
      return;
    }

    // Add account and project details to each entry
    const augmentedEntries = validEntries.map(entry => ({
      ...entry,
      accountId: selectedAccount,
      accountName: selectedAccountName,
      projectId: projectId
    }));

    console.log(augmentedEntries);

    try {
      window.electronAPI.mainOperation('bulkCreateExpenses', augmentedEntries);
      toast.success(`Submitted ${augmentedEntries.length} expenses`);
      // Reset state
      setParsedData([]);
      setValidatedData([]);
    } catch (error) {
      toast.error('Failed to submit expenses');
    }
  };

  const clearData = () => {
    setParsedData([]);
    setValidatedData([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input 
          type="file" 
          accept=".csv,.xlsx" 
          onChange={handleFileUpload} 
          disabled={isLoading}
        />
        {parsedData.length > 0 && (
          <>
            <Button variant="destructive" onClick={clearData}>Clear</Button>
            <Button onClick={handleSubmit}>Submit</Button>
          </>
        )}
      </div>

      {/* Account selection */}
      <div className="border p-4 rounded-md">
        <label className="block text-sm font-medium mb-2">Select Account</label>
        <Select
          value={selectedAccount}
          onValueChange={(value) => {
            setSelectedAccount(value);
            const account = accounts.find(acc => acc._id === value);
            setSelectedAccountName(account ? account.name : '');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => (
              <SelectItem key={account._id} value={account._id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <p>Parsing file...</p>}

      {validatedData.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedData.map((entry, index) => (
                <TableRow 
                  key={index} 
                  className={entry.isValid ? '' : 'bg-red-50'}
                >
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.amount}</TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>
                    {entry.isValid ? (
                      <span className="text-green-600">Valid</span>
                    ) : (
                      <span className="text-red-600">{entry.errors}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
