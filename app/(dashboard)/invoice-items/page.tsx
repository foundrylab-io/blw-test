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

  const userInvoiceItems = await db
    .select({
      id: invoiceItems.id,
      name: invoiceItems.name,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      unitPrice: invoiceItems.unitPrice,
      totalPrice: invoiceItems.totalPrice,
      sortOrder: invoiceItems.sortOrder,
      createdAt: invoiceItems.createdAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      clientName: clients.name
    })
    .from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoiceItems.userId, user.id))
    .orderBy(desc(invoiceItems.createdAt));

  const invoicesList = await db
    .select({ 
      id: invoices.id, 
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title 
    })
    .from(invoices)
    .where(eq(invoices.userId, user.id))
    .orderBy(invoices.invoiceNumber);

  async function createInvoiceItem(formData: FormData) {
    'use server';
    
    const user = await getUser();
    if (!user) redirect('/sign-in');

    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = parseFloat(formData.get('quantity') as string);
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!invoiceId || !name || !quantity || !unitPrice) {
      return;
    }

    const totalPrice = quantity * unitPrice;

    await db.insert(invoiceItems).values({
      userId: user.id,
      invoiceId,
      name,
      description: description || null,
      quantity: quantity.toString(),
      unitPrice: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
      sortOrder,
    });

    revalidatePath('/invoice-items');
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoice Items</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add New Item
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Create Invoice Item Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createInvoiceItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceId">Invoice</Label>
                <select
                  id="invoiceId"
                  name="invoiceId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an invoice</option>
                  {invoicesList.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} - {invoice.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue="1" required />
              </div>
              <div>
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input id="unitPrice" name="unitPrice" type="number" step="0.01" required />
              </div>
              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input id="sortOrder" name="sortOrder" type="number" defaultValue="0" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">Create Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Invoice Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            {userInvoiceItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No invoice items created yet</p>
                <p className="text-sm">Create your first invoice item to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userInvoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.description || '-'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">{item.invoiceTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{parseFloat(item.quantity).toFixed(2)}</TableCell>
                      <TableCell>${parseFloat(item.unitPrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calculator className="w-4 h-4 text-green-500" />
                          ${parseFloat(item.totalPrice).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{item.sortOrder}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}