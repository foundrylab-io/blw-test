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
import { Plus, List, Calculator } from 'lucide-react';

export default async function ProposalLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [allLineItems, allProposals] = await Promise.all([
    db
      .select({
        id: proposalLineItems.id,
        title: proposalLineItems.title,
        description: proposalLineItems.description,
        quantity: proposalLineItems.quantity,
        rate: proposalLineItems.rate,
        amount: proposalLineItems.amount,
        order: proposalLineItems.order,
        proposalTitle: proposals.title,
        clientName: clients.name,
        createdAt: proposalLineItems.createdAt,
      })
      .from(proposalLineItems)
      .leftJoin(proposals, eq(proposalLineItems.proposalId, proposals.id))
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposalLineItems.userId, currentUser.id))
      .orderBy(desc(proposalLineItems.createdAt)),
    db
      .select({
        id: proposals.id,
        title: proposals.title,
        clientName: clients.name,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.userId, currentUser.id))
      .orderBy(proposals.title),
  ]);

  async function createLineItem(formData: FormData) {
    'use server';
    
    const proposalId = formData.get('proposalId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;

    if (!proposalId || !title.trim() || !quantity || !rate) return;

    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toFixed(2);

    await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId: parseInt(proposalId),
      title: title.trim(),
      description: description?.trim() || null,
      quantity: quantity,
      rate: rate,
      amount: amount,
      order: 0,
    });

    // Update proposal total
    const proposalItems = await db
      .select({ amount: proposalLineItems.amount })
      .from(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, parseInt(proposalId)));
    
    const totalAmount = proposalItems.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      parseFloat(amount)
    ).toFixed(2);

    await db
      .update(proposals)
      .set({ totalAmount })
      .where(eq(proposals.id, parseInt(proposalId)));

    revalidatePath('/proposal-line-items');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proposal Line Items</h1>
          <p className="text-gray-600 mt-2">Manage line items for your proposals</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Line Item
        </Button>
      </div>

      {allProposals.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Line Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createLineItem} className="space-y-4">
              <div>
                <Label htmlFor="proposalId">Proposal</Label>
                <select
                  id="proposalId"
                  name="proposalId"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a proposal...</option>
                  {allProposals.map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.title}{proposal.clientName ? ` - ${proposal.clientName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="title">Item Title</Label>
                <Input type="text" id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    id="quantity"
                    name="quantity"
                    step="0.01"
                    min="0"
                    defaultValue="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Rate ($)</Label>
                  <Input
                    type="number"
                    id="rate"
                    name="rate"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            All Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allLineItems.length === 0 ? (
            <div className="text-center py-12">
              <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No line items yet</h3>
              <p className="text-gray-500 mb-4">Add line items to your proposals to define pricing.</p>
              {allProposals.length === 0 && (
                <p className="text-sm text-gray-400">You'll need to create proposals first.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allLineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{item.proposalTitle}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.clientName}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {parseFloat(item.quantity || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCurrency(item.rate)}
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(item.createdAt)}
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