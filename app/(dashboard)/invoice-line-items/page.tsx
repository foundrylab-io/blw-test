import { db } from '@/lib/db/drizzle';
import { invoiceLineItems, invoices, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt, DollarSign, Hash, FileText } from 'lucide-react';

export default async function InvoiceLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch invoice line items with invoice and project data
  const lineItemList = await db
    .select({
      id: invoiceLineItems.id,
      name: invoiceLineItems.name,
      description: invoiceLineItems.description,
      quantity: invoiceLineItems.quantity,
      unitPrice: invoiceLineItems.unitPrice,
      totalPrice: invoiceLineItems.totalPrice,
      sortOrder: invoiceLineItems.sortOrder,
      createdAt: invoiceLineItems.createdAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      projectName: projects.name,
      clientCompanyName: clients.companyName,
    })
    .from(invoiceLineItems)
    .leftJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoiceLineItems.userId, currentUser.id))
    .orderBy(desc(invoiceLineItems.createdAt));

  // Fetch invoices for the form
  const invoiceList = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      projectName: projects.name,
      clientCompanyName: clients.companyName,
    })
    .from(invoices)
    .leftJoin(projects, eq(invoices.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const quantity = parseInt(formData.get('quantity') as string) || 1;
    const unitPrice = formData.get('unitPrice') as string || '0';
    
    // Calculate total price
    const totalPrice = (quantity * parseFloat(unitPrice)).toFixed(2);
    
    // Get next sort order
    const existingItems = await db
      .select({ sortOrder: invoiceLineItems.sortOrder })
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));
    
    const nextSortOrder = existingItems.length > 0 
      ? Math.max(...existingItems.map(item => item.sortOrder ?? 0)) + 1 
      : 0;
    
    await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId,
      name,
      description,
      quantity,
      unitPrice,
      totalPrice,
      sortOrder: nextSortOrder,
    });
    
    // Update invoice total
    const allLineItems = await db
      .select({ totalPrice: invoiceLineItems.totalPrice })
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId));
    
    const invoiceTotal = allLineItems.reduce((sum, item) => sum + parseFloat(item.totalPrice ?? '0'), parseFloat(totalPrice));
    
    await db
      .update(invoices)
      .set({ totalAmount: invoiceTotal.toFixed(2) })
      .where(eq(invoices.id, invoiceId));
    
    revalidatePath('/invoice-line-items');
  }

  const formatCurrency = (amount: string) => {
    return `$${parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice Line Items</h1>
          <p className="text-muted-foreground">
            Manage line items for your invoices
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Create Line Item Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Line Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createLineItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceId">Invoice</Label>
                  <select
                    id="invoiceId"
                    name="invoiceId"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select an invoice...</option>
                    {invoiceList.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber ?? 'N/A'} - {invoice.title ?? 'Untitled'}
                        {invoice.clientCompanyName && ` (${invoice.clientCompanyName})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" placeholder="Web development" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Detailed description of the work performed..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Line Item
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Line Items List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Invoice Line Items ({lineItemList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lineItemList.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No line items yet</h3>
                <p className="text-muted-foreground">Add your first line item to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItemList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name ?? 'Untitled'}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{item.invoiceNumber ?? 'N/A'}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">
                              {item.invoiceTitle ?? 'Untitled'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.projectName ?? 'N/A'}</TableCell>
                        <TableCell>{item.clientCompanyName ?? 'No Client'}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-muted rounded-full text-sm font-medium">
                            {item.quantity ?? 1}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.unitPrice ?? '0')}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(item.totalPrice ?? '0')}
                        </TableCell>
                        <TableCell>
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }).format(new Date(item.createdAt))}
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
    </div>
  );
}