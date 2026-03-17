import { db } from '@/lib/db/drizzle';
import { proposalItems, proposals, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, DollarSign } from 'lucide-react';

export default async function ProposalItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const itemsList = await db
    .select({
      id: proposalItems.id,
      name: proposalItems.name,
      description: proposalItems.description,
      quantity: proposalItems.quantity,
      rate: proposalItems.rate,
      amount: proposalItems.amount,
      sortOrder: proposalItems.sortOrder,
      createdAt: proposalItems.createdAt,
      proposalTitle: proposals.title,
      clientName: clients.name
    })
    .from(proposalItems)
    .leftJoin(proposals, eq(proposalItems.proposalId, proposals.id))
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposalItems.userId, currentUser.id))
    .orderBy(desc(proposalItems.createdAt));

  const proposalsList = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      clientName: clients.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(proposals.title);

  async function createProposalItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const proposalId = parseInt(formData.get('proposalId') as string);
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    
    if (!name || !proposalId || !quantity || !rate) {
      return;
    }

    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = quantityNum * rateNum;

    await db.insert(proposalItems).values({
      userId: currentUser.id,
      proposalId,
      name,
      description: description ?? '',
      quantity: quantity,
      rate: rate,
      amount: amount.toString()
    });
    
    revalidatePath('/proposal-items');
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposal Items</h1>
          <p className="text-muted-foreground mt-2">
            Manage line items for your proposals
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Item
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {itemsList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  All Proposal Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemsList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.name ?? 'Unnamed Item'}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.proposalTitle ?? 'Unknown Proposal'}
                        </TableCell>
                        <TableCell>
                          {item.clientName ?? 'Unknown Client'}
                        </TableCell>
                        <TableCell>
                          {(item.quantity ?? '1')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {(item.rate ?? '0')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 font-medium">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {(item.amount ?? '0')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No proposal items yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add line items to your proposals to detail services and pricing
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent>
              {proposalsList.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    You need to create a proposal first before adding items.
                  </p>
                  <Button className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Create Proposal
                  </Button>
                </div>
              ) : (
                <form action={createProposalItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposalId">Proposal</Label>
                    <select
                      id="proposalId"
                      name="proposalId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">Select a proposal</option>
                      {proposalsList.map((proposal) => (
                        <option key={proposal.id} value={proposal.id}>
                          {proposal.title} - {proposal.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Website Design"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Detailed description of the service or product..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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

                    <div className="space-y-2">
                      <Label htmlFor="rate">Rate ($)</Label>
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

                  <Button type="submit" className="w-full">
                    Add Item
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}