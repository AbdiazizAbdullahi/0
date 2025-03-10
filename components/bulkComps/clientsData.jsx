import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseFile, validateData } from '@/lib/bulkImportUtils';
import { toast } from 'sonner';

export default function ClientsData() {
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const jsonData = await parseFile(file);
      setParsedData(jsonData);
      
      // Validate data
      const validated = validateData.clients(jsonData);
      setValidatedData(validated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    // Filter only valid entries
    const validEntries = validatedData.filter(entry => entry.isValid);
    
    if (validEntries.length === 0) {
      toast.error('No valid entries to submit');
      return;
    }

    try {
      window.electronAPI.mainOperation('bulkCreateClients', validEntries);
      toast.success(`Submitted ${validEntries.length} clients`);
      // Reset state
      setParsedData([]);
      setValidatedData([]);
    } catch (error) {
      toast.error('Failed to submit clients');
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
            <div className="flex space-x-72">
              <Button variant="destructive" onClick={clearData}>Clear</Button>
              <Button onClick={handleSubmit}>Submit</Button>
            </div>
          </>
        )}
      </div>

      {isLoading && <p>Parsing file...</p>}

      {validatedData.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedData.map((entry, index) => (
                <TableRow 
                  key={index} 
                  className={entry.isValid ? '' : 'bg-red-50'}
                >
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>{entry.balance}</TableCell>
                  <TableCell>{entry.currency}</TableCell>
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
