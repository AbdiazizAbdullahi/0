import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseFile, validateData } from '@/lib/bulkImportUtils';
import { toast } from 'sonner';
import useProjectStore from '@/stores/projectStore';

export default function InvoicesData() {
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedSupplierName, setSelectedSupplierName] = useState('');
  const [projectId, setProjectId] = useState('');
  const project = useProjectStore(state => state.project);

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id);
    }
  }, [project]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliersResult = await window.electronAPI.mainOperation('getAllSuppliers', projectId);
        
        if (suppliersResult.success) setSuppliers(suppliersResult.suppliers);
      } catch (error) {
        toast.error('Failed to fetch projects and suppliers');
      }
    };
    
    fetchData();
  }, [projectId]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const jsonData = await parseFile(file);
      setParsedData(jsonData);
      
      // Validate data
      const validated = validateData.invoices(jsonData);
      setValidatedData(validated);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSupplier) {
      toast.error('Please select a supplier');
      return;
    }

    // Filter only valid entries
    const validEntries = validatedData
      .filter(entry => entry.isValid)
      .map(entry => ({
        ...entry,
        supplierId: selectedSupplier,
        supplierName: selectedSupplierName,
        projectId: projectId
      }));
    
    if (validEntries.length === 0) {
      toast.error('No valid entries to submit');
      return;
    }

    console.log(validEntries)

    try {
      const result = await window.electronAPI.mainOperation('bulkCreateInvoices', validEntries);
      console.log(result)
      toast.success(`Submitted ${validEntries.length} invoices`);
      // Reset state
      setParsedData([]);
      setValidatedData([]);
      setSelectedSupplier('');
    } catch (error) {
      toast.error('Failed to submit invoices');
    }
  };

  const clearData = () => {
    setParsedData([]);
    setValidatedData([]);
    setSelectedSupplier('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex gap-4">
          <Select 
            value={selectedSupplier} 
            onValueChange={(value) => {
              setSelectedSupplier(value);
              const supplier = suppliers.find(s => s._id === value);
              setSelectedSupplierName(supplier ? supplier.name : '');
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(supplier => (
                <SelectItem key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
      </div>

      {isLoading && <p>Parsing file...</p>}

      {validatedData.length > 0 && (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validatedData.map((entry, index) => (
                <TableRow 
                  key={index} 
                  className={entry.isValid ? '' : 'bg-red-50'}
                >
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>{entry.amount}</TableCell>
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
