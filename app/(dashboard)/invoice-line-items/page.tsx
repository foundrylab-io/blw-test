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
import { Plus, FileText, Hash } from 'lucide-react';

export default async function InvoiceLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userInvoiceLineItems = await db
    .select({
      id: invoiceLineItems.id,
      title: invoiceLineItems.title,
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

  const userInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(invoices.invoiceNumber);

  async function createInvoiceLineItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const quantity = parseFloat(formData.get('quantity') as string || '1');
    const rate = parseFloat(formData.get('rate') as string || '0');
    const order = parseInt(formData.get('order') as string || '0');
    const amount = quantity * rate;

    if (!invoiceId || !title || !rate) {
      return;
    }

    await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId,
      title,
      description: description || null,
      quantity: quantity.toString(),
      rate: rate.toString(),
      amount: amount.toString(),
      order,
    });

    revalidatePath('/invoice-line-items');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Items</h1>
          <p className="text-muted-foreground">Manage line items for your invoices</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Line Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {userInvoiceLineItems.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Your Line Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userInvoiceLineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.invoiceNumber}</div>
                            <div className="text-sm text-muted-foreground">{item.invoiceTitle}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.clientName || 'Unknown Client'}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={item.description || undefined}>
                            {item.description || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{parseFloat(item.quantity || '0').toLocaleString()}</TableCell>
                        <TableCell>${parseFloat(item.rate || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="font-medium">
                          ${parseFloat(item.amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{item.order}</TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Hash className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No line items yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add line items to your invoices to itemize your services
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Line Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userInvoices.length > 0 ? (
                <form action={createInvoiceLineItem} className="space-y-4">
                  <div>
                    <Label htmlFor="invoiceId">Invoice *</Label>
                    <select
                      id="invoiceId"
                      name="invoiceId"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="">Select an invoice</option>
                      {userInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - {invoice.title}
                          {invoice.clientName ? ` (${invoice.clientName})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Website Design"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      rows={3}
                      placeholder="Detailed description of the service..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
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
                  </div>
                  <div>
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
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Create an invoice first to add line items
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}