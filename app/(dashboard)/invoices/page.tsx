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

  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(projects, eq(invoices.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt));

  async function createInvoice(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const title = formData.get('title') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const dueDate = formData.get('dueDate') as string;

    if (!projectId || !invoiceNumber || !title || !totalAmount) {
      return;
    }

    await db.insert(invoices).values({
      userId: currentUser.id,
      projectId,
      invoiceNumber,
      title,
      totalAmount,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'draft',
    });

    revalidatePath('/invoices');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage and track your invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Invoice Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInvoice} className="space-y-4">
                <div>
                  <Label htmlFor="projectId">Project</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a project...</option>
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.clientName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    name="invoiceNumber"
                    placeholder="INV-001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Web Development Services"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
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
                <Button type="submit" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Invoices ({allInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allInvoices.length === 0 ? (
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
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
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
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>{invoice.title}</TableCell>
                          <TableCell>{invoice.projectName}</TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(invoice.paidAmount)}</TableCell>
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
      </div>
    </div>
  );
}