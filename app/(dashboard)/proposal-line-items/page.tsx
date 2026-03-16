import { db } from '@/lib/db/drizzle';
import { proposalLineItems, proposals, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText } from 'lucide-react';

export default async function ProposalLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const lineItemsList = await db
    .select({
      id: proposalLineItems.id,
      description: proposalLineItems.description,
      quantity: proposalLineItems.quantity,
      unitPrice: proposalLineItems.unitPrice,
      totalPrice: proposalLineItems.totalPrice,
      sortOrder: proposalLineItems.sortOrder,
      createdAt: proposalLineItems.createdAt,
      proposalTitle: proposals.title,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(proposalLineItems)
    .leftJoin(proposals, eq(proposalLineItems.proposalId, proposals.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(proposalLineItems.userId, currentUser.id))
    .orderBy(desc(proposalLineItems.createdAt));

  const proposalOptions = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(proposals)
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const description = formData.get('description') as string;
    const proposalId = parseInt(formData.get('proposalId') as string);
    const quantity = parseFloat(formData.get('quantity') as string) || 1;
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const totalPrice = quantity * unitPrice;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId,
      description,
      quantity: quantity.toString(),
      unitPrice: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
      sortOrder,
    });

    revalidatePath('/proposal-line-items');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Proposal Line Items</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Line Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Line Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLineItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="proposalId">Proposal</Label>
                <select
                  id="proposalId"
                  name="proposalId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a proposal</option>
                  {proposalOptions.map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.title} - {proposal.projectName} ({proposal.clientName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Line item description..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  step="0.01"
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
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  defaultValue="0"
                />
              </div>
            </div>
            <Button type="submit">Create Line Item</Button>
          </form>
        </CardContent>
      </Card>

      {lineItemsList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No line items yet</h3>
            <p className="text-gray-500 text-center">Create your first proposal line item to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Sort Order</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItemsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium max-w-xs truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell>{item.proposalTitle || '-'}</TableCell>
                    <TableCell>{item.projectName || '-'}</TableCell>
                    <TableCell>{item.clientName || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}