import { db } from '@/lib/db/drizzle';
import { invoiceItems, invoices, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, DollarSign, Hash } from 'lucide-react';

export default async function InvoiceItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const itemList = await db
    .select({
      id: invoiceItems.id,
      name: invoiceItems.name,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      unitPrice: invoiceItems.unitPrice,
      totalPrice: invoiceItems.totalPrice,
      sortOrder: invoiceItems.sortOrder,
      invoiceTitle: invoices.title,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.name,
      createdAt: invoiceItems.createdAt,
    })
    .from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoiceItems.userId, currentUser.id))
    .orderBy(desc(invoiceItems.createdAt));

  const invoiceList = await db
    .select({
      id: invoices.id,
      title: invoices.title,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(invoices.invoiceNumber);

  async function createInvoiceItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const description = formData.get('description') as string || '';
    const quantity = formData.get('quantity') as string;
    const unitPrice = formData.get('unitPrice') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
    
    if (!name || !invoiceId) {
      return;
    }

    const qty = parseFloat(quantity) || 1;
    const price = parseFloat(unitPrice) || 0;
    const total = qty * price;
    
    await db.insert(invoiceItems).values({
      userId: currentUser.id,
      invoiceId,
      name,
      description,
      quantity: qty.toString(),
      unitPrice: price.toString(),
      totalPrice: total.toString(),
      sortOrder,
    });
    
    revalidatePath('/invoice-items');
  }

  const formatCurrency = (amount: string | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount ?? '0'));
  };

  const formatNumber = (value: string | null) => {
    return parseFloat(value ?? '0').toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Items</h1>
          <p className="text-muted-foreground">Manage line items for your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create New Invoice Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceId">Invoice *</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select an invoice</option>
                {invoiceList.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber ?? 'INV'} - {invoice.title ?? 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Service or product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                placeholder="1"
                defaultValue="1"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                defaultValue="0"
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                placeholder="0"
                defaultValue="0"
              />
            </div>
            <div></div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Item description..."
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full">
                Create Invoice Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          {itemList.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No invoice items yet</h3>
              <p className="mt-1 text-gray-500">Get started by creating your first invoice item.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Sort Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name ?? '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-gray-600">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-mono text-sm">
                            {item.invoiceNumber ?? 'INV'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.invoiceTitle ?? 'Untitled'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.clientName ?? 'Unknown Client'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(item.quantity)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                          <Hash className="h-3 w-3" />
                          {item.sortOrder ?? 0}
                        </span>
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