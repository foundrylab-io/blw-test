import { db } from '@/lib/db/drizzle';
import { invoices, clients, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Calendar, DollarSign, Clock } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const invoiceList = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      clientName: clients.name,
      projectName: projects.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
    })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  const projectList = await db
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
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const description = formData.get('description') as string || '';
    const totalAmount = formData.get('totalAmount') as string;
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null;
    
    if (!invoiceNumber || !title || !clientId) {
      return;
    }

    const amount = parseFloat(totalAmount) || 0;
    
    await db.insert(invoices).values({
      userId: currentUser.id,
      clientId,
      projectId,
      invoiceNumber,
      title,
      description,
      totalAmount: amount.toString(),
      subtotal: amount.toString(),
      dueDate,
    });
    
    revalidatePath('/invoices');
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount ?? '0'));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
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
          <p className="text-muted-foreground">Create and track invoices for your clients</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                type="text"
                placeholder="INV-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Invoice title"
                required
              />
            </div>
            <div>
              <Label htmlFor="clientId">Client *</Label>
              <select
                id="clientId"
                name="clientId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select a client</option>
                {clientList.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name ?? 'Unknown Client'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="projectId">Project</Label>
              <select
                id="projectId"
                name="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No project</option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name ?? 'Unknown Project'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue="0"
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
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Invoice description..."
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
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
          {invoiceList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No invoices yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating your first invoice.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceList.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.invoiceNumber ?? '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.title ?? '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.clientName ?? 'Unknown Client'}
                      </TableCell>
                      <TableCell>
                        {invoice.projectName ?? '-'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {(invoice.status ?? 'draft').charAt(0).toUpperCase() + (invoice.status ?? 'draft').slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(invoice.issueDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(invoice.dueDate)}
                        </div>
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
  );
}