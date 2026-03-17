import { db } from '@/lib/db/drizzle';
import { invoices, clients, projects, invoiceLineItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, DollarSign, Calendar } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      dueDate: invoices.dueDate,
      sentAt: invoices.sentAt,
      paidAt: invoices.paidAt,
      createdAt: invoices.createdAt,
      clientName: clients.name,
      projectName: projects.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  const userClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createInvoice(formData: FormData) {
    'use server';
    
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const title = formData.get('title') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const description = formData.get('description') as string;
    const subtotal = parseFloat(formData.get('subtotal') as string || '0');
    const taxRate = formData.get('taxRate') ? parseFloat(formData.get('taxRate') as string) : null;
    const taxAmount = taxRate ? (subtotal * taxRate / 100) : null;
    const totalAmount = subtotal + (taxAmount || 0);
    const dueDate = formData.get('dueDate') ? new Date(formData.get('dueDate') as string) : null;

    if (!invoiceNumber || !title || !clientId) {
      return;
    }

    await db.insert(invoices).values({
      userId: currentUser.id,
      invoiceNumber,
      title,
      clientId,
      projectId,
      description: description || null,
      subtotal: subtotal.toString(),
      taxRate: taxRate ? taxRate.toString() : null,
      taxAmount: taxAmount ? taxAmount.toString() : null,
      totalAmount: totalAmount.toString(),
      dueDate,
    });

    revalidatePath('/invoices');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600';
      case 'sent': return 'text-blue-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and track payments</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {userInvoices.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Invoices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.title}</TableCell>
                        <TableCell>{invoice.clientName || 'Unknown Client'}</TableCell>
                        <TableCell>{invoice.projectName || '-'}</TableCell>
                        <TableCell className="font-medium">
                          ${parseFloat(invoice.totalAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`capitalize ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first invoice to start billing clients
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInvoice} className="space-y-4">
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
                    placeholder="Website Development"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientId">Client *</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    required
                  >
                    <option value="">Select a client</option>
                    {userClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {userProjects.length > 0 && (
                  <div>
                    <Label htmlFor="projectId">Project (Optional)</Label>
                    <select
                      id="projectId"
                      name="projectId"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="">Select a project</option>
                      {userProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    rows={3}
                    placeholder="Invoice description..."
                  />
                </div>
                <div>
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    name="subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    name="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="0.00"
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
                <Button type="submit" className="w-full">
                  Create Invoice
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}