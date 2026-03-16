import { db } from '@/lib/db/drizzle';
import { invoiceItems, invoices, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Calculator } from 'lucide-react';

export default async function InvoiceItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [itemList, invoiceList] = await Promise.all([
    db
      .select({
        id: invoiceItems.id,
        name: invoiceItems.name,
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        rate: invoiceItems.rate,
        amount: invoiceItems.amount,
        sortOrder: invoiceItems.sortOrder,
        invoiceId: invoiceItems.invoiceId,
        invoiceNumber: invoices.invoiceNumber,
        invoiceTitle: invoices.title,
        clientName: clients.name,
      })
      .from(invoiceItems)
      .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoiceItems.userId, currentUser.id))
      .orderBy(desc(invoiceItems.sortOrder), invoiceItems.name),
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        clientName: clients.name,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoices.createdAt)),
  ]);

  async function createInvoiceItem(formData: FormData) {
    'use server';
    const invoiceId = formData.get('invoiceId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;

    if (!invoiceId || !name || !quantity || !rate) return;

    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toFixed(2);

    await db.insert(invoiceItems).values({
      userId: currentUser.id,
      invoiceId: parseInt(invoiceId),
      name,
      description: description || null,
      quantity,
      rate,
      amount,
      sortOrder: 0,
    });

    // Update invoice total
    const allItems = await db
      .select({ amount: invoiceItems.amount })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, parseInt(invoiceId)));
    
    const newTotal = allItems.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    await db
      .update(invoices)
      .set({ 
        subtotal: newTotal.toFixed(2),
        total: newTotal.toFixed(2) 
      })
      .where(eq(invoices.id, parseInt(invoiceId)));

    revalidatePath('/invoice-items');
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const totalItems = itemList.length;
  const totalValue = itemList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
  const avgItemValue = totalItems > 0 ? totalValue / totalItems : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Items</h1>
          <p className="text-gray-600 mt-1">Manage line items for your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue.toString())}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Item Value</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgItemValue.toString())}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Invoice Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select an invoice</option>
                {invoiceList.map(invoice => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.title} ({invoice.clientName})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Web Development"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Frontend development work"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="1"
                defaultValue="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                name="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="100.00"
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add Item
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
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No invoice items</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first invoice item.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemList.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.invoiceNumber}
                      </TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {item.description || 'No description'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {parseFloat(item.quantity).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(item.rate)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(item.amount)}
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