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
import { Plus, Package, Hash, DollarSign } from 'lucide-react';

export default async function InvoiceItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const allInvoiceItems = await db
    .select({
      id: invoiceItems.id,
      name: invoiceItems.name,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      rate: invoiceItems.rate,
      amount: invoiceItems.amount,
      sortOrder: invoiceItems.sortOrder,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      clientName: clients.name,
      createdAt: invoiceItems.createdAt,
    })
    .from(invoiceItems)
    .leftJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoiceItems.userId, currentUser.id))
    .orderBy(desc(invoiceItems.createdAt));

  const invoicesList = await db
    .select({ 
      id: invoices.id, 
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title 
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  async function createInvoiceItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const name = formData.get('name') as string;
    const description = (formData.get('description') as string) || '';
    const quantity = parseFloat(formData.get('quantity') as string) || 1;
    const rate = parseFloat(formData.get('rate') as string) || 0;
    const amount = quantity * rate;
    
    await db.insert(invoiceItems).values({
      userId: currentUser.id,
      invoiceId,
      name,
      description,
      quantity: quantity.toString(),
      rate: rate.toString(),
      amount: amount.toString(),
      sortOrder: 0,
    });
    
    // Update invoice total
    const items = await db
      .select({ amount: invoiceItems.amount })
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
    
    const total = items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0) + amount;
    
    await db
      .update(invoices)
      .set({ 
        subtotal: total.toString(),
        totalAmount: total.toString() 
      })
      .where(eq(invoices.id, invoiceId));
    
    revalidatePath('/invoice-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Items</h1>
          <p className="text-muted-foreground mt-2">
            Manage line items for your invoices
          </p>
        </div>
      </div>

      {/* Create Invoice Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Invoice Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceItem} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice *</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select an invoice</option>
                {invoicesList.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber ?? 'N/A'} - {invoice.title ?? 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Website Design"
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
                min="0"
                defaultValue="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Rate ($) *</Label>
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
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Additional details about this item..."
              />
            </div>
            
            <div className="md:col-span-2 lg:col-span-3">
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Invoice Item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Invoice Items List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Your Invoice Items ({allInvoiceItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allInvoiceItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No invoice items yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Add line items to your invoices to track individual services or products.
              </p>
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
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allInvoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name ?? 'Unnamed Item'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.description ? (
                          item.description
                        ) : (
                          <span className="text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {item.invoiceNumber ?? 'N/A'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.invoiceTitle ?? 'Untitled Invoice'}
                        </div>
                      </TableCell>
                      <TableCell>{item.clientName ?? 'Unknown Client'}</TableCell>
                      <TableCell className="text-center">
                        {Number(item.quantity ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-muted-foreground" />
                          {Number(item.rate ?? 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {Number(item.amount ?? 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.createdAt ? new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(new Date(item.createdAt)) : 'Unknown'}
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