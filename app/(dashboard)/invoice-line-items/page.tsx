import { db } from '@/lib/db/drizzle';
import { invoiceLineItems, invoices, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ListChecks, Plus, FileSpreadsheet, Hash } from 'lucide-react';

export default async function InvoiceLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userLineItems = await db
    .select({
      id: invoiceLineItems.id,
      name: invoiceLineItems.name,
      description: invoiceLineItems.description,
      quantity: invoiceLineItems.quantity,
      rate: invoiceLineItems.rate,
      total: invoiceLineItems.total,
      order: invoiceLineItems.order,
      invoiceTitle: invoices.title,
      invoiceNumber: invoices.invoiceNumber,
      clientName: clients.name,
    })
    .from(invoiceLineItems)
    .leftJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoiceLineItems.userId, currentUser.id))
    .orderBy(desc(invoiceLineItems.createdAt));

  const invoiceOptions = await db
    .select({ 
      id: invoices.id, 
      title: invoices.title,
      invoiceNumber: invoices.invoiceNumber
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    const order = formData.get('order') as string;

    const quantityNum = parseFloat(quantity) || 1;
    const rateNum = parseFloat(rate) || 0;
    const total = (quantityNum * rateNum).toFixed(2);

    await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId,
      name,
      description: description || '',
      quantity: quantity || '1',
      rate: rate || '0',
      total,
      order: parseInt(order) || 0,
    });

    revalidatePath('/invoice-line-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ListChecks className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Invoice Line Items</h1>
        </div>
        <Button type="button" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add New Line Item</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              {userLineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No line items found. Create your first invoice line item to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Client</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userLineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-medium">
                              {(item.order ?? 0) + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.name ?? 'Unnamed Item'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.description ?? 'No description'}
                          </TableCell>
                          <TableCell>{(Number(item.quantity) ?? 0).toString()}</TableCell>
                          <TableCell>${(Number(item.rate) ?? 0).toFixed(2)}</TableCell>
                          <TableCell className="font-medium">
                            ${(Number(item.total) ?? 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{item.invoiceNumber ?? 'N/A'}</div>
                              <div className="text-gray-500 truncate max-w-xs">
                                {item.invoiceTitle ?? 'Untitled'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.clientName ?? 'Unknown Client'}</TableCell>
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
              <CardTitle>Add Line Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createLineItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceId">Invoice</Label>
                  <select
                    id="invoiceId"
                    name="invoiceId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an invoice</option>
                    {invoiceOptions.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber ?? 'N/A'} - {invoice.title ?? 'Untitled'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Website Design"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Detailed description of the service or product..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="0.01"
                      min="0.01"
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
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="0"
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add Line Item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}