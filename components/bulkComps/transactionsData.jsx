import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseFile, validateData } from '@/lib/bulkImportUtils';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import useProjectStore from '@/stores/projectStore';

export default function TransactionsData() {
  const [parsedData, setParsedData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mappingSource, setMappingSource] = useState("account");
  const [mappingTransType, setMappingTransType] = useState("deposit");
  const [mappingFrom, setMappingFrom] = useState("");
  const [mappingFromName, setMappingFromName] = useState("");
  const [mappingDestination, setMappingDestination] = useState("account");
  const [mappingTo, setMappingTo] = useState("");
  const [mappingToName, setMappingToName] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [agents, setAgents] = useState([]);

  const [projectId, setProjectId] = useState('');
  const project = useProjectStore(state => state.project);

  useEffect(() => {
    if (project?._id) {
      setProjectId(project._id)
    }
  }, [project])
    

  const getOptions = (type) => {
    if (type === 'account') return accounts;
    if (type === 'client') return clients;
    if (type === 'supplier') return suppliers;
    if (type === 'agent') return agents;
    return [];
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const resAccounts = await window.electronAPI.mainOperation('getAllAccounts', projectId);
        setAccounts(resAccounts.success ? resAccounts.accounts : []);
        const resClients = await window.electronAPI.mainOperation('getAllClients', projectId);
        setClients(resClients.success ? resClients.clients : []);
        const resSuppliers = await window.electronAPI.mainOperation('getAllSuppliers', projectId);
        setSuppliers(resSuppliers.success ? resSuppliers.suppliers : []);
        const resAgents = await window.electronAPI.mainOperation('getAllAgents', projectId);
        setAgents(resAgents.success ? resAgents.agents : []);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    }
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
      const validated = validateData.transactions(jsonData);
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

    // Augment each valid entry with mapping fields
    const augmentedEntries = validEntries.map(entry => ({
      ...entry,
      source: mappingSource,
      transType: mappingTransType,
      from: mappingFrom,
      fromName: mappingFromName,
      destination: mappingDestination,
      to: mappingTo,
      toName: mappingToName,
      projectId: projectId,
    }));

    console.log(augmentedEntries);

    try {
      window.electronAPI.mainOperation('bulkCreateTransactions', augmentedEntries);
      toast.success(`Submitted ${augmentedEntries.length} transactions`);
      // Reset state
      setParsedData([]);
      setValidatedData([]);
    } catch (error) {
      toast.error('Failed to submit transactions');
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

      {/* New mapping form for transaction fields */}
      <div className="border p-4 rounded-md space-y-3">
        <h3 className="text-lg font-semibold">Transaction Field Mapping</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Source</label>
            <Select value={mappingSource} onValueChange={setMappingSource}>
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">Transaction Type</label>
            <Select value={mappingTransType} onValueChange={setMappingTransType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">DEBIT</SelectItem>
                <SelectItem value="credit">CREDIT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">From</label>
            <Select
              value={mappingFrom}
              onValueChange={(value) => {
                setMappingFrom(value);
                const option = getOptions(mappingSource).find(opt => opt._id === value);
                setMappingFromName(option ? option.name : '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select From" />
              </SelectTrigger>
              <SelectContent>
                {getOptions(mappingSource).map((option) => (
                  <SelectItem key={option._id} value={option._id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* <div>
            <label className="block text-sm font-medium">From Name</label>
            <Input 
              type="text" 
              value={mappingFromName} 
              readOnly 
              placeholder="Auto-selected from name" 
            />
          </div> */}
          <div>
            <label className="block text-sm font-medium">Destination</label>
            <Select value={mappingDestination} onValueChange={setMappingDestination}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium">To</label>
            <Select
              value={mappingTo}
              onValueChange={(value) => {
                setMappingTo(value);
                const option = getOptions(mappingDestination).find(opt => opt._id === value);
                setMappingToName(option ? option.name : '');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select To" />
              </SelectTrigger>
              <SelectContent>
                {getOptions(mappingDestination).map((option) => (
                  <SelectItem key={option._id} value={option._id}>{option.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* <div className="col-span-2">
            <label className="block text-sm font-medium">To Name</label>
            <Input 
              type="text" 
              value={mappingToName} 
              readOnly 
              placeholder="Auto-selected to name" 
            />
          </div> */}
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
                <TableHead>currency</TableHead>
                <TableHead>rate</TableHead>
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
                  <TableCell>{entry.currency}</TableCell>
                  <TableCell>{entry.rate}</TableCell>
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
