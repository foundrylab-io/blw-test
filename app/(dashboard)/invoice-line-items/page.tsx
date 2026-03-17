import { db } from '@/lib/db/drizzle';
import { invoiceLineItems, invoices, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, List, DollarSign, Hash } from 'lucide-react';

export default async function InvoiceLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const allLineItems = await db
    .select({
      id: invoiceLineItems.id,
      description: invoiceLineItems.description,
      quantity: invoiceLineItems.quantity,
      rate: invoiceLineItems.rate,
      amount: invoiceLineItems.amount,
      order: invoiceLineItems.order,
      createdAt: invoiceLineItems.createdAt,
      invoiceId: invoiceLineItems.invoiceId,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      clientName: clients.name,
    })
    .from(invoiceLineItems)
    .leftJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoiceLineItems.userId, currentUser.id))
    .orderBy(desc(invoiceLineItems.createdAt));

  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(invoices.invoiceNumber);

  async function createLineItem(formData: FormData) {
    'use server';
    
    const invoiceId = formData.get('invoiceId') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    const order = formData.get('order') as string;
    
    if (!invoiceId || !description || !quantity || !rate) {
      return;
    }
    
    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toFixed(2);
    
    await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId: parseInt(invoiceId),
      description,
      quantity,
      rate,
      amount,
      order: order ? parseInt(order) : 0,
    });
    
    revalidatePath('/invoice-line-items');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatQuantity = (quantity: string | null) => {
    if (!quantity) return '0';
    const num = parseFloat(quantity);
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const totalItems = allLineItems.length;
  const totalAmount = allLineItems.reduce((sum, item) => sum + parseFloat(item.amount ?? '0'), 0);
  const averageAmount = totalItems > 0 ? totalAmount / totalItems : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Items</h1>
          <p className="text-muted-foreground">
            Manage individual line items for your invoices
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Line Items</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAmount.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageAmount.toString())}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Invoices</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allInvoices.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Line Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLineItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Label htmlFor="invoiceId">Invoice *</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select an invoice</option>
                {allInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber ?? ''} - {invoice.title ?? ''}
                    {invoice.status && invoice.status !== 'draft' && (
                      <span> ({(invoice.status).charAt(0).toUpperCase() + (invoice.status).slice(1)})</span>
                    )}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-3">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                placeholder="Description of work or service"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1"
                defaultValue="1"
                required
              />
            </div>
            <div>
              <Label htmlFor="rate">Rate *</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                name="order"
                type="number"
                min="0"
                placeholder="0"
                defaultValue="0"
              />
            </div>
            <div className="lg:col-span-3">
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {allLineItems.length === 0 ? (
            <div className="text-center py-12">
              <List className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No line items yet</h3>
              <p className="mt-2 text-muted-foreground">
                Add your first line item to an invoice.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLineItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium font-mono text-sm">
                          {item.invoiceNumber ?? ''}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {item.invoiceTitle ?? ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[300px] truncate" title={item.description ?? ''}>
                        {item.description ?? ''}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {formatQuantity(item.quantity)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatCurrency(item.rate)}
                    </TableCell>
                    <TableCell className="font-mono font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-medium">
                        {(item.order ?? 0).toString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.clientName ?? 'Unknown'}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(item.createdAt)}
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