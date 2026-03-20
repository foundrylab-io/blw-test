import { db } from '@/lib/db/drizzle';
import { proposalLineItems, proposals, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Hash, DollarSign, Calculator } from 'lucide-react';

export default async function ProposalLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const lineItemsList = await db
    .select({
      id: proposalLineItems.id,
      name: proposalLineItems.name,
      description: proposalLineItems.description,
      quantity: proposalLineItems.quantity,
      rate: proposalLineItems.rate,
      total: proposalLineItems.total,
      order: proposalLineItems.order,
      createdAt: proposalLineItems.createdAt,
      proposalTitle: proposals.title,
      clientName: clients.name
    })
    .from(proposalLineItems)
    .leftJoin(proposals, eq(proposalLineItems.proposalId, proposals.id))
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposalLineItems.userId, currentUser.id))
    .orderBy(desc(proposalLineItems.createdAt));

  const proposalsList = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      clientName: clients.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const proposalId = formData.get('proposalId') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    const order = formData.get('order') as string;

    if (!name || !proposalId) return;

    const quantityNum = parseFloat(quantity) || 1;
    const rateNum = parseFloat(rate) || 0;
    const total = quantityNum * rateNum;

    await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId: parseInt(proposalId),
      name,
      description: description || '',
      quantity: quantity || '1',
      rate: rate || '0',
      total: total.toString(),
      order: order ? parseInt(order) : 0
    });

    revalidatePath('/proposal-line-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposal Line Items</h1>
          <p className="text-gray-600 mt-1">Manage detailed pricing items for your proposals</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Line Item
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Line Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLineItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="proposalId">Proposal</Label>
                <select
                  id="proposalId"
                  name="proposalId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Select a proposal</option>
                  {proposalsList.map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.title ?? 'Untitled'} - {proposal.clientName ?? 'Unknown Client'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="0"
                  placeholder="0"
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
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="Item description"
              />
            </div>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Line Item
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lineItemsList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No line items yet</h3>
              <p className="text-gray-500 mb-4">Create your first proposal line item to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItemsList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        {(item.order ?? 0).toString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{item.name ?? 'Unnamed Item'}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.proposalTitle ?? 'Unknown Proposal'}</TableCell>
                    <TableCell>{item.clientName ?? 'Unknown Client'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-gray-400" />
                        {(item.quantity ?? 1).toString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {(item.rate ?? 0).toString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        {(item.total ?? 0).toString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(item.createdAt))}
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