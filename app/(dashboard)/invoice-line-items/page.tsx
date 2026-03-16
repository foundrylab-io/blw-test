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
import { Plus, List, Calculator } from 'lucide-react';

export default async function InvoiceLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const allLineItems = await db
    .select({
      id: invoiceLineItems.id,
      description: invoiceLineItems.description,
      quantity: invoiceLineItems.quantity,
      unitPrice: invoiceLineItems.unitPrice,
      totalPrice: invoiceLineItems.totalPrice,
      sortOrder: invoiceLineItems.sortOrder,
      createdAt: invoiceLineItems.createdAt,
      invoiceNumber: invoices.invoiceNumber,
      invoiceTitle: invoices.title,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(invoiceLineItems)
    .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .innerJoin(projects, eq(invoices.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoiceLineItems.userId, currentUser.id))
    .orderBy(desc(invoiceLineItems.createdAt));

  const allInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(invoices)
    .innerJoin(projects, eq(invoices.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const invoiceId = parseInt(formData.get('invoiceId') as string);
    const description = formData.get('description') as string;
    const quantity = parseFloat(formData.get('quantity') as string) || 1;
    const unitPrice = parseFloat(formData.get('unitPrice') as string) || 0;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!invoiceId || !description || unitPrice <= 0) {
      return;
    }

    const totalPrice = quantity * unitPrice;

    await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId,
      description,
      quantity: quantity.toString(),
      unitPrice: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
      sortOrder,
    });

    revalidatePath('/invoice-line-items');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatQuantity = (qty: string | null) => {
    if (!qty) return '1';
    return parseFloat(qty).toString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Invoice Line Items</h1>
          <p className="text-gray-600 mt-2">Manage line items for your invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Line Item Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Line Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createLineItem} className="space-y-4">
                <div>
                  <Label htmlFor="invoiceId">Invoice</Label>
                  <select
                    id="invoiceId"
                    name="invoiceId"
                    required
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select an invoice...</option>
                    {allInvoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {invoice.title} ({invoice.clientName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Web development hours"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
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
                  <div>
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <Input
                      id="unitPrice"
                      name="unitPrice"
                      type="number"
                      step="0.01"
                      placeholder="100.00"
                      required
                    />
                  </div>
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
                <Button type="submit" className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Line Items List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Line Items ({allLineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allLineItems.length === 0 ? (
                <div className="text-center py-12">
                  <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No line items yet</h3>
                  <p className="text-gray-600">Add line items to your invoices to track individual services or products.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLineItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={item.description}>
                              {item.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.invoiceNumber}</div>
                            <div className="text-sm text-gray-600 truncate">{item.invoiceTitle}</div>
                          </TableCell>
                          <TableCell>{item.projectName}</TableCell>
                          <TableCell>{item.clientName}</TableCell>
                          <TableCell>{formatQuantity(item.quantity)}</TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell>{item.sortOrder}</TableCell>
                          <TableCell>{formatDate(item.createdAt)}</TableCell>
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
    </div>
  );
}