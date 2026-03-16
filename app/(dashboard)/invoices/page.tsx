import { db } from '@/lib/db/drizzle';
import { invoices, clients, projects, invoiceItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, DollarSign, Calendar, Eye, Check, Clock } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [invoiceData, clientsData, projectsData] = await Promise.all([
    db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      clientId: invoices.clientId,
      projectId: invoices.projectId
    }).from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoices.createdAt)),
    db.select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.userId, currentUser.id)),
    db.select({ id: projects.id, name: projects.name, clientId: projects.clientId })
      .from(projects)
      .where(eq(projects.userId, currentUser.id))
  ]);

  const clientsMap = new Map(clientsData.map(c => [c.id, c.name]));
  const projectsMap = new Map(projectsData.map(p => [p.id, p.name]));

  async function createInvoice(formData: FormData) {
    'use server';
    
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const title = formData.get('title') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const totalAmount = formData.get('totalAmount') as string;
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null;
    
    if (!invoiceNumber || !title || !clientId || !totalAmount) {
      return;
    }
    
    await db.insert(invoices).values({
      userId: currentUser.id,
      invoiceNumber,
      title,
      clientId,
      projectId,
      totalAmount,
      dueDate,
      status: 'draft'
    });
    
    revalidatePath('/invoices');
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'paid': return <Check className="h-4 w-4 text-green-600" />;
      case 'sent': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <Clock className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50';
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Invoice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoice} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                placeholder="INV-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Web Development Services"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <select
                id="clientId"
                name="clientId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select client</option>
                {clientsData.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <select
                id="projectId"
                name="projectId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No project</option>
                {projectsData.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount *</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                placeholder="1000.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Create Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Invoices ({invoiceData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceData.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
              <p className="text-gray-600">Create your first invoice to get started.</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>{invoice.title}</TableCell>
                      <TableCell>{clientsMap.get(invoice.clientId) || 'Unknown'}</TableCell>
                      <TableCell>
                        {invoice.projectId ? (projectsMap.get(invoice.projectId) || 'Unknown') : '—'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(invoice.totalAmount || '0').toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString()}
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