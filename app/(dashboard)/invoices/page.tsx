import { db } from '@/lib/db/drizzle';
import { invoices, clients, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, DollarSign, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      description: invoices.description,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      sentAt: invoices.sentAt,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      clientName: clients.name,
      clientCompany: clients.company,
      projectName: projects.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  const allClients = await db
    .select({
      id: clients.id,
      name: clients.name,
      company: clients.company,
    })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientId: projects.clientId,
    })
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createInvoice(formData: FormData) {
    'use server';
    
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const dueDate = formData.get('dueDate') as string;
    
    if (!invoiceNumber || !title || !clientId || !totalAmount) {
      return;
    }
    
    await db.insert(invoices).values({
      userId: currentUser.id,
      invoiceNumber,
      title,
      description: description || null,
      clientId: parseInt(clientId),
      projectId: projectId ? parseInt(projectId) : null,
      totalAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'draft',
    });
    
    revalidatePath('/invoices');
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'sent':
        return 'text-blue-600 bg-blue-50';
      case 'overdue':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create and track invoices for your clients
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInvoices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                allInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount ?? '0'), 0).toString()
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                allInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.paidAmount ?? '0'), 0).toString()
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                allInvoices.reduce((sum, invoice) => {
                  const total = parseFloat(invoice.totalAmount ?? '0');
                  const paid = parseFloat(invoice.paidAmount ?? '0');
                  return sum + (total - paid);
                }, 0).toString()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoice} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                placeholder="INV-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Invoice title"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientId">Client *</Label>
              <select
                id="clientId"
                name="clientId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select a client</option>
                {allClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}{client.company ? ` (${client.company})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="projectId">Project (Optional)</Label>
              <select
                id="projectId"
                name="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No project</option>
                {allProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Invoice description or notes"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {allInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No invoices yet</h3>
              <p className="mt-2 text-muted-foreground">
                Create your first invoice to start billing clients.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono text-sm">
                      {invoice.invoiceNumber ?? ''}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.title ?? ''}</div>
                        {invoice.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {invoice.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.clientName ?? ''}</div>
                        {invoice.clientCompany && (
                          <div className="text-sm text-muted-foreground">
                            {invoice.clientCompany}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.projectName ? (
                        <span className="text-sm">{invoice.projectName}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No project</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(invoice.status ?? '')}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status ?? '')}`}>
                          {(invoice.status ?? '').charAt(0).toUpperCase() + (invoice.status ?? '').slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(invoice.paidAmount)}
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(invoice.dueDate)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}