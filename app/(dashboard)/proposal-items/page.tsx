import { db } from '@/lib/db/drizzle';
import { proposalItems, proposals, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Receipt, Calculator } from 'lucide-react';

export default async function ProposalItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [itemsList, proposalsList] = await Promise.all([
    db
      .select({
        id: proposalItems.id,
        name: proposalItems.name,
        description: proposalItems.description,
        quantity: proposalItems.quantity,
        rate: proposalItems.rate,
        amount: proposalItems.amount,
        sortOrder: proposalItems.sortOrder,
        createdAt: proposalItems.createdAt,
        proposal: {
          id: proposals.id,
          title: proposals.title,
        },
        client: {
          id: clients.id,
          name: clients.name,
          company: clients.company,
        },
      })
      .from(proposalItems)
      .leftJoin(proposals, eq(proposalItems.proposalId, proposals.id))
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposalItems.userId, currentUser.id))
      .orderBy(desc(proposalItems.createdAt)),
    db
      .select({
        id: proposals.id,
        title: proposals.title,
        clientName: clients.name,
        clientCompany: clients.company,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.userId, currentUser.id))
      .orderBy(proposals.title),
  ]);

  async function createProposalItem(formData: FormData) {
    'use server';
    
    const proposalId = parseInt(formData.get('proposalId') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = parseFloat(formData.get('quantity') as string) || 1;
    const rate = parseFloat(formData.get('rate') as string) || 0;
    const amount = quantity * rate;
    
    if (!proposalId || !name) {
      return;
    }

    await db.insert(proposalItems).values({
      userId: currentUser.id,
      proposalId,
      name,
      description: description || '',
      quantity: quantity.toString(),
      rate: rate.toString(),
      amount: amount.toString(),
      sortOrder: 0,
    });

    // Update proposal total
    const items = await db
      .select({ amount: proposalItems.amount })
      .from(proposalItems)
      .where(eq(proposalItems.proposalId, proposalId));
    
    const total = items.reduce((sum, item) => sum + parseFloat(item.amount ?? '0'), 0) + amount;
    
    await db
      .update(proposals)
      .set({ totalAmount: total.toString() })
      .where(eq(proposals.id, proposalId));

    revalidatePath('/proposal-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposal Items</h1>
          <p className="text-gray-600">Manage line items for your proposals</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Proposal Line Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No proposal items created yet</p>
                  <p className="text-sm">Add line items to your proposals</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.name ?? ''}
                            </div>
                            {item.description && (
                              <div className="text-sm text-gray-500">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.proposal?.title ?? 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">
                              {item.client?.name ?? 'Unknown'}
                            </div>
                            {item.client?.company && (
                              <div className="text-xs text-gray-500">
                                {item.client.company}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(parseFloat(item.quantity ?? '1')).toString()}
                        </TableCell>
                        <TableCell>
                          ${(parseFloat(item.rate ?? '0')).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${(parseFloat(item.amount ?? '0')).toFixed(2)}
                        </TableCell>
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                New Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProposalItem} className="space-y-4">
                <div>
                  <Label htmlFor="proposalId">Proposal</Label>
                  <select
                    id="proposalId"
                    name="proposalId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a proposal...</option>
                    {proposalsList.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.title} {proposal.clientName && `- ${proposal.clientName}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Website Design"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Detailed description..."
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
                      min="0"
                      defaultValue="1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rate">Rate ($)</Label>
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      required
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calculator className="w-3 h-3" />
                  Amount will be calculated as Quantity × Rate
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}