import { db } from '@/lib/db/drizzle';
import { invoices, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt, DollarSign, Calendar, FileText } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch invoices with project and client data
  const invoiceList = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      description: invoices.description,
      status: invoices.status,
      dueDate: invoices.dueDate,
      totalAmount: invoices.totalAmount,
      taxAmount: invoices.taxAmount,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      projectName: projects.name,
      clientCompanyName: clients.companyName,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  // Fetch projects for the form
  const projectList = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientCompanyName: clients.companyName,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt));

  async function createInvoice(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string || '';
    const totalAmount = formData.get('totalAmount') as string || '0';
    const taxAmount = formData.get('taxAmount') as string || '0';
    const dueDate = formData.get('dueDate') as string;
    
    // Generate invoice number
    const invoiceCount = await db
      .select({ count: invoices.id })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id));
    
    const invoiceNumber = `INV-${String(invoiceCount.length + 1).padStart(4, '0')}`;
    
    await db.insert(invoices).values({
      userId: currentUser.id,
      projectId,
      invoiceNumber,
      title,
      description,
      totalAmount,
      taxAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'draft',
    });
    
    revalidatePath('/invoices');
  }

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatStatus = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Generate and track invoices for your projects
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create Invoice Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvoice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a project...</option>
                    {projectList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} - {project.clientCompanyName ?? 'No Client'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Invoice Title</Label>
                  <Input id="title" name="title" placeholder="Monthly services" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Additional details about this invoice..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxAmount">Tax Amount</Label>
                  <Input
                    id="taxAmount"
                    name="taxAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
              </div>
              
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Your Invoices ({invoiceList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceList.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No invoices yet</h3>
                <p className="text-muted-foreground">Create your first invoice to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceList.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber ?? 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice.title ?? 'Untitled'}</div>
                            {invoice.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {invoice.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{invoice.projectName ?? 'N/A'}</TableCell>
                        <TableCell>{invoice.clientCompanyName ?? 'No Client'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${formatStatus(invoice.status ?? 'draft')}`}>
                            {(invoice.status ?? 'draft').charAt(0).toUpperCase() + (invoice.status ?? 'draft').slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(invoice.totalAmount ?? '0')}
                          {invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 && (
                            <div className="text-xs text-muted-foreground">
                              +{formatCurrency(invoice.taxAmount)} tax
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Intl.DateTimeFormat('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              }).format(new Date(invoice.dueDate))}
                            </div>
                          ) : (
                            'No due date'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(invoice.createdAt))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}