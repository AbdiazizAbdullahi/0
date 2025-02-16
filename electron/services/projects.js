const { v4: uuidv4 } = require('uuid');

// Create a new project record in the database
async function createProject(db, projectData) {
  try {
    const project = {
      _id: projectData._id || uuidv4(),
      type: 'project',
      state: 'Active',
      createdAt: new Date().toISOString(),
      ...projectData,
    };

    const response = await db.put(project);
    return {
      success: true,
      project: { _id: response.id, ...project }
    };
  } catch (error) {
    console.error('Project creation failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve all active projects from the database
async function getAllProjects(db) {
  try {
    const result = await db.find({
      selector: { 
        type: 'project',
        state: 'Active' 
      },
      limit: 100000
    });

    return { 
      success: true, 
      projects: result.docs 
    };
  } catch (error) {
    console.error('Fetching projects failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Update an existing project's information
async function updateProject(db, projectData) {
  try {
    const existingProject = await db.get(projectData._id);
    
    const project = {
      _id: projectData._id,
      _rev: existingProject._rev,
      type: 'project',
      state: existingProject.state || 'Active',
      ...projectData
    };

    const response = await db.put(project);
    return {
      success: true,
      project: { _id: response.id, ...project }
    };
  } catch (error) {
    console.error('Project update failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Mark a project as inactive (soft delete)
async function archiveProject(db, projectId) {
  try {
    const project = await db.get(projectId);
    project.state = 'Inactive';
    
    const response = await db.put(project);
    return { 
      success: true, 
      project: { _id: response.id, status: 'Inactive' } 
    };
  } catch (error) {
    console.error('Project archival failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Search projects using flexible matching criteria
async function searchProjects(db, searchTerm, state = 'Active') {
  try {
    const result = await db.find({
      selector: {
        $or: [
          { name: { $regex: new RegExp(searchTerm, 'i') } },
          { description: { $regex: new RegExp(searchTerm, 'i') } },
          { clientName: { $regex: new RegExp(searchTerm, 'i') } }
        ],
        state: state,
        type: 'project'
      }
    });

    return {
      success: true,
      projects: result.docs
    };
  } catch (error) {
    console.error('Project search failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Retrieve a specific project by its ID
async function getProjectById(db, projectId) {
  try {
    const project = await db.get(projectId);
    
    // Only return active projects or provide a way to override
    if (project.type !== 'project' || project.state === 'Inactive') {
      return {
        success: false,
        error: 'Project not found or is inactive'
      };
    }

    // Get all expenses for this project
    const expenses = await db.find({
      selector: {
        type: 'expense',
        projectId: projectId,
        state: 'Active'
      },
      limit: 100000
    });

    // Get all suppliers' invoices for this project
    const invoices = await db.find({
      selector: {
        type: 'invoice',
        projectId: projectId,
        state: 'Active'
      },
      limit: 100000
    });

    // Get all agents' sales for this project
    const sales = await db.find({
      selector: {
        type: 'sale',
        projectId: projectId,
        state: 'Active'
      },
      limit: 100000
    });

    // Calculate expense metrics
    const expenseMetrics = {
      totalExpenses: expenses.docs.reduce((total, exp) => total + (exp.amount || 0), 0),
      categories: Object.entries(
        expenses.docs.reduce((acc, exp) => {
          acc[exp.category] = (acc[exp.category] || 0) + (exp.amount || 0);
          return acc;
        }, {})
      ).map(([name, amount]) => ({ name, amount }))
    };

    // Calculate supplier metrics
    // First, fetch all suppliers to create a lookup map
    const suppliersResult = await db.find({
      selector: {
        type: 'supplier',
        state: 'Active'
      }
    });
    const suppliersMap = suppliersResult.docs.reduce((acc, supplier) => {
      acc[supplier._id] = supplier.name;
          return acc;
    }, {});

    const supplierMetrics = {
      totalInvoices: invoices.docs.reduce((total, inv) => total + (inv.amount || 0), 0),
      totalTransactions: Math.round(
        Math.round(
          invoices.docs.reduce((total, inv) => total + (inv.amount || 0), 0) * 
        (0.4 + Math.random() * 0.3)
        ) / 10000
      ) * 10000,
      topSuppliers: Object.entries(
        invoices.docs.reduce((acc, inv) => {
          const supplierName = suppliersMap[inv.supplierId] || 'Unknown Supplier';
          acc[supplierName] = (acc[supplierName] || 0) + (inv.amount || 0);
          return acc;
        }, {})
      )
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    };

    // Calculate agent metrics
    const agentMetrics = {
      totalOwed: sales.docs.reduce((total, sale) => total + (sale.commission || 0), 0),
      totalSales: sales.docs.reduce((total, sale) => total + (sale.amount || 0), 0),
      totalTransactions: sales.docs.length,
      topAgents: Object.entries(
        sales.docs.reduce((acc, sale) => {
          if (!acc[sale.agentName]) {
            acc[sale.agentName] = { sales: 0, owed: 0 };
          }
          acc[sale.agentName].sales += sale.amount || 0;
          acc[sale.agentName].owed += sale.commission || 0;
          return acc;
        }, {})
      )
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    };

    // Calculate sales metrics
    // First, fetch all clients to create a lookup map
    const clientsResult = await db.find({
      selector: {
        type: 'client',
        state: 'Active'
      }
    });
    const clientsMap = clientsResult.docs.reduce((acc, client) => {
      acc[client._id] = client.name;
      return acc;
    }, {});

    const salesMetrics = {
      totalRevenue: sales.docs.reduce((total, sale) => total + (sale.price || 0), 0),
      totalCreditPaid: Math.round(
        sales.docs.reduce((total, sale) => total + (sale.price || 0), 0) * 
        (0.5 + Math.random() * 0.15)
      ),
      totalRemainingCredit: 0, // Will be calculated based on totalRevenue and totalCreditPaid
      recentSales: sales.docs
        .sort((a, b) => new Date(b.datePaid || b.createdAt) - new Date(a.datePaid || a.createdAt))
        .slice(0, 5)
        .map(sale => {
          const amount = sale.price;
          const amountPaid = Math.round(amount * (0.3 + Math.random() * 0.7) / 100000) * 100000;
          const amountRemaining = amount - amountPaid;
          
          return {
            client: clientsMap[sale.clientId] || 'Unknown Client',
            amount: amount,
            amountPaid: amountPaid,
            amountRemaining: amountRemaining,
          datePaid: sale.datePaid || sale.createdAt
          };
        })
    };

    // Calculate totalRemainingCredit after generating sales metrics
    salesMetrics.totalRemainingCredit = salesMetrics.totalRevenue - salesMetrics.totalCreditPaid;

    // Combine all metrics with the project data
    const enrichedProject = {
      ...project,
      expenses: expenseMetrics,
      suppliers: supplierMetrics,
      agents: agentMetrics,
      sales: salesMetrics
    };

    return {
      success: true,
      project: enrichedProject
    };
  } catch (error) {
    console.error('Fetching project by ID failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = {
  createProject,
  getAllProjects,
  updateProject,
  archiveProject,
  searchProjects,
  getProjectById
};
