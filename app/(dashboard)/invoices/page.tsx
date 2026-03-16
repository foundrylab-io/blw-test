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
import { Plus, FileText, DollarSign } from 'lucide-react';

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [invoiceList, clientList, projectList] = await Promise.all([
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        status: invoices.status,
        total: invoices.total,
        dueDate: invoices.dueDate,
        createdAt: invoices.createdAt,
        clientName: clients.name,
        projectName: projects.name,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(projects, eq(invoices.projectId, projects.id))
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoices.createdAt)),
    db
      .select({ id: clients.id, name: clients.name })
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .orderBy(clients.name),
    db
      .select({ id: projects.id, name: projects.name, clientId: projects.clientId })
      .from(projects)
      .where(eq(projects.userId, currentUser.id))
      .orderBy(projects.name),
  ]);

  async function createInvoice(formData: FormData) {
    'use server';
    const title = formData.get('title') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string;
    const dueDate = formData.get('dueDate') as string;
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!title || !clientId || !invoiceNumber) return;

    await db.insert(invoices).values({
      userId: currentUser.id,
      clientId: parseInt(clientId),
      projectId: projectId ? parseInt(projectId) : null,
      invoiceNumber,
      title,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'draft',
      subtotal: '0',
      tax: '0',
      total: '0',
    });

    revalidatePath('/invoices');
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateFormat('en-US').format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-700',
      sent: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
    };
    return `px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage and track your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Invoice
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceList.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                invoiceList
                  .filter(invoice => invoice.status === 'paid')
                  .reduce((sum, invoice) => sum + parseFloat(invoice.total || '0'), 0)
                  .toString()
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                invoiceList
                  .filter(invoice => invoice.status === 'sent')
                  .reduce((sum, invoice) => sum + parseFloat(invoice.total || '0'), 0)
                  .toString()
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
          <form action={createInvoice} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                placeholder="INV-001"
                required
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a client</option>
                {clientList.map(client => (
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project</option>
                {projectList.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoices</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first invoice.
              </p>
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
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceList.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {invoice.title}
                      </TableCell>
                      <TableCell>{invoice.clientName}</TableCell>
                      <TableCell>{invoice.projectName || 'No project'}</TableCell>
                      <TableCell>
                        <span className={getStatusBadge(invoice.status)}>
                          {invoice.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(invoice.total || '0')}
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
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