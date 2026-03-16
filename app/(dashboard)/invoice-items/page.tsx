import { db } from '@/lib/db/drizzle';
import { invoiceItems, invoices, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Receipt, Plus, Calculator } from 'lucide-react';

export default async function InvoiceItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [itemsData, invoicesData] = await Promise.all([
    db.select({
      id: invoiceItems.id,
      invoiceId: invoiceItems.invoiceId,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      unitPrice: invoiceItems.unitPrice,
      totalPrice: invoiceItems.totalPrice,
      sortOrder: invoiceItems.sortOrder,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      clientName: clients.name
    }).from(invoiceItems)
      .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoiceItems.invoiceId), invoiceItems.sortOrder),
    db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title
    }).from(invoices)
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoices.createdAt))
  ]);

  async function createInvoiceItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const unitPrice = formData.get('unitPrice') as string;
    
    if (!invoiceId || !description || !quantity || !unitPrice) {
      return;
    }
    
    const quantityNum = parseFloat(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    const totalPrice = quantityNum * unitPriceNum;
    
    // Get the current max sort order for this invoice
    const maxSortResult = await db.select({ maxSort: invoiceItems.sortOrder })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId))
      .orderBy(desc(invoiceItems.sortOrder))
      .limit(1);
    
    const nextSortOrder = (maxSortResult[0]?.maxSort || 0) + 1;
    
    await db.insert(invoiceItems).values({
      invoiceId,
      description,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice.toString(),
      sortOrder: nextSortOrder
    });
    
    // Update the invoice total amount
    const allItems = await db.select({ totalPrice: invoiceItems.totalPrice })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
    
    const newTotal = allItems.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), totalPrice);
    
    await db.update(invoices)
      .set({ totalAmount: newTotal.toString() })
      .where(eq(invoices.id, invoiceId));
    
    revalidatePath('/invoice-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Items</h1>
          <p className="text-gray-600 mt-1">Manage line items for your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Invoice Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice *</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select invoice</option>
                {invoicesData.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                name="description"
                placeholder="Web development services"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="0.01"
                placeholder="1"
                defaultValue="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price *</Label>
              <Input
                id="unitPrice"
                name="unitPrice"
                type="number"
                step="0.01"
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
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice Items ({itemsData.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {itemsData.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoice items yet</h3>
              <p className="text-gray-600">Add items to your invoices to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{item.invoiceNumber}</div>
                          <div className="text-sm text-gray-600">{item.invoiceTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.clientName || 'Unknown'}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={item.description || undefined}>
                          {item.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calculator className="h-3 w-3 text-gray-400" />
                          {parseFloat(item.quantity || '0').toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(item.unitPrice || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="font-bold">
                        ${parseFloat(item.totalPrice || '0').toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          #{item.sortOrder}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Value:</span>
                  <span className="text-lg font-bold">
                    ${itemsData.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}