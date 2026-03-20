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
import { Plus, ListChecks, Receipt, Calculator } from 'lucide-react';

export default async function InvoiceItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const invoiceItemsList = await db
    .select({
      id: invoiceItems.id,
      name: invoiceItems.name,
      description: invoiceItems.description,
      quantity: invoiceItems.quantity,
      rate: invoiceItems.rate,
      amount: invoiceItems.amount,
      sortOrder: invoiceItems.sortOrder,
      createdAt: invoiceItems.createdAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      clientName: clients.name,
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
      title: invoices.title,
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  async function createInvoiceItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    const sortOrder = formData.get('sortOrder') as string;
    
    if (!name || !invoiceId || !quantity || !rate) {
      return;
    }

    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toFixed(2);

    await db.insert(invoiceItems).values({
      userId: currentUser.id,
      invoiceId,
      name,
      description: description || '',
      quantity,
      rate,
      amount,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    });

    revalidatePath('/invoice-items');
  }

  const totalItems = invoiceItemsList.length;
  const totalAmount = invoiceItemsList.reduce((sum, item) => sum + parseFloat((item.amount ?? '0').toString()), 0);
  const avgItemValue = totalItems > 0 ? totalAmount / totalItems : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Items</h1>
          <p className="text-muted-foreground">Manage line items for your invoices</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Item Value</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgItemValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoicesList.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Invoice Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInvoiceItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Label htmlFor="invoiceId">Invoice</Label>
              <select
                id="invoiceId"
                name="invoiceId"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select invoice</option>
                {invoicesList.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber ?? 'N/A'} - {invoice.title ?? 'Untitled'}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                name="name"
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
                min="0"
                placeholder="1"
                required
              />
            </div>
            
            <div>
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
            
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
            
            <div className="lg:col-span-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Optional description"
              />
            </div>
            
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
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
          {invoiceItemsList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invoice items yet. Add your first item above.</p>
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
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceItemsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.name ?? 'Unnamed Item'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {(item.description ?? '').slice(0, 50)}{(item.description ?? '').length > 50 ? '...' : ''}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{item.invoiceNumber ?? 'N/A'}</div>
                        <div className="text-muted-foreground truncate max-w-xs">
                          {item.invoiceTitle ?? 'Untitled'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.clientName ?? 'Unknown Client'}</TableCell>
                    <TableCell>{(item.quantity ?? '0').toString()}</TableCell>
                    <TableCell>${(item.rate ?? '0').toString()}</TableCell>
                    <TableCell className="font-medium">${(item.amount ?? '0').toString()}</TableCell>
                    <TableCell>{(item.sortOrder ?? 0).toString()}</TableCell>
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
  );
}