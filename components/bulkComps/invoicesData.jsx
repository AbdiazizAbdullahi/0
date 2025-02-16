import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseFile, validateData } from '@/lib/bulkImportUtils';
import { toast } from 'sonner';

export default function InvoicesData() {
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsResult = await window.electronAPI.mainOperation('getAllProjects');
        const suppliersResult = await window.electronAPI.mainOperation('getAllSuppliers');
        
        if (projectsResult.success) setProjects(projectsResult.projects);
        if (suppliersResult.success) setSuppliers(suppliersResult.suppliers);
      } catch (error) {
        toast.error('Failed to fetch projects and suppliers');
      }
    };
    
    fetchData();
  }, []);

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
    if (!selectedProject || !selectedSupplier) {
      toast.error('Please select both project and supplier');
      return;
    }

    // Filter only valid entries
    const validEntries = validatedData
      .filter(entry => entry.isValid)
      .map(entry => ({
        ...entry,
        projectId: selectedProject,
        supplierId: selectedSupplier
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
      setSelectedProject('');
      setSelectedSupplier('');
    } catch (error) {
      toast.error('Failed to submit invoices');
    }
  };

  const clearData = () => {
    setParsedData([]);
    setValidatedData([]);
    setSelectedProject('');
    setSelectedSupplier('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project._id} value={project._id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
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
              <Button variant="destructive" onClick={clearData}>Clear</Button>
              <Button onClick={handleSubmit}>Submit</Button>
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
                <TableHead>Client ID</TableHead>
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
                  <TableCell>{entry.client_id}</TableCell>
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
