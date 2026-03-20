import { db } from '@/lib/db/drizzle';
import { invoices, clients, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, FileText, Calendar, DollarSign } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      clientName: clients.name,
      projectName: projects.name,
      status: invoices.status,
      total: invoices.total,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      paidDate: invoices.paidDate,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  const clientOptions = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.userId, currentUser.id));

  const projectOptions = await db
    .select({ id: projects.id, name: projects.name, clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.userId, currentUser.id));

  async function createInvoice(formData: FormData) {
    'use server';
    
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const title = formData.get('title') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') as string;
    const description = formData.get('description') as string;
    const total = formData.get('total') as string;
    const dueDate = formData.get('dueDate') as string;

    await db.insert(invoices).values({
      userId: currentUser.id,
      clientId,
      projectId: projectId ? parseInt(projectId) : null,
      invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
      title,
      description: description || '',
      total: total || '0',
      dueDate: new Date(dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      status: 'draft',
    });

    revalidatePath('/invoices');
  }

  function getStatusColor(status: string | null) {
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
        <div className="flex items-center space-x-2">
          <Receipt className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Invoices</h1>
        </div>
        <Button type="button" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add New Invoice</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {userInvoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices found. Create your first invoice to get started.</p>
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
                        <TableHead>Total</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber ?? 'N/A'}
                          </TableCell>
                          <TableCell>{invoice.title ?? 'Untitled'}</TableCell>
                          <TableCell>{invoice.clientName ?? 'Unknown Client'}</TableCell>
                          <TableCell>{invoice.projectName ?? 'No Project'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {(invoice.status ?? 'draft').charAt(0).toUpperCase() + (invoice.status ?? 'draft').slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>${(Number(invoice.total) ?? 0).toFixed(2)}</TableCell>
                          <TableCell>
                            {invoice.dueDate ? new Intl.DateTimeFormat('en-US').format(new Date(invoice.dueDate)) : 'N/A'}
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInvoice} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    placeholder="INV-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Website Development"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a client</option>
                    {clientOptions.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name ?? 'Unnamed Client'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No project</option>
                    {projectOptions.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name ?? 'Unnamed Project'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Invoice description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total">Total Amount</Label>
                  <Input
                    id="total"
                    name="total"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    required
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