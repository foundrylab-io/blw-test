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
import { Plus, List, DollarSign } from 'lucide-react';

export default async function ProposalLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userLineItems = await db
    .select({
      id: proposalLineItems.id,
      description: proposalLineItems.description,
      quantity: proposalLineItems.quantity,
      rate: proposalLineItems.rate,
      amount: proposalLineItems.amount,
      order: proposalLineItems.order,
      createdAt: proposalLineItems.createdAt,
      proposalTitle: proposals.title,
      clientName: clients.name,
      clientCompany: clients.company
    })
    .from(proposalLineItems)
    .innerJoin(proposals, eq(proposalLineItems.proposalId, proposals.id))
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposalLineItems.userId, currentUser.id))
    .orderBy(desc(proposalLineItems.createdAt));

  const userProposals = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      clientName: clients.name,
      clientCompany: clients.company
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(proposals.title);

  async function createLineItem(formData: FormData) {
    'use server';
    
    const proposalId = parseInt(formData.get('proposalId') as string);
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const rate = formData.get('rate') as string;
    const order = formData.get('order') as string;
    
    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toFixed(2);

    await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId,
      description,
      quantity: quantity || '1',
      rate: rate || '0',
      amount,
      order: order ? parseInt(order) : 0
    });

    revalidatePath('/proposal-line-items');
  }

  const totalValue = userLineItems.reduce((sum, item) => {
    return sum + parseFloat(item.amount ?? '0');
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Proposal Line Items</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <List className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Items</p>
                <p className="text-2xl font-bold">{userLineItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <List className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Active Proposals</p>
                <p className="text-2xl font-bold">{userProposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                All Line Items ({userLineItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userLineItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No line items yet</p>
                  <p>Add line items to your proposals to itemize your services.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Proposal</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userLineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium max-w-xs">
                          <div className="truncate" title={item.description}>
                            {item.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.proposalTitle}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{item.clientName ?? ''}</div>
                            {item.clientCompany && (
                              <div className="text-xs text-muted-foreground">{item.clientCompany}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{(parseFloat(item.quantity ?? '1')).toString()}</TableCell>
                        <TableCell>${(parseFloat(item.rate ?? '0')).toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${(parseFloat(item.amount ?? '0')).toFixed(2)}</TableCell>
                        <TableCell>{item.order ?? 0}</TableCell>
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
                <Plus className="h-5 w-5" />
                Add Line Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userProposals.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm mb-2">No proposals available</p>
                  <p className="text-xs">Create a proposal first to add line items.</p>
                </div>
              ) : (
                <form action={createLineItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proposalId">Proposal</Label>
                    <select
                      id="proposalId"
                      name="proposalId"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a proposal...</option>
                      {userProposals.map((proposal) => (
                        <option key={proposal.id} value={proposal.id}>
                          {proposal.title} - {proposal.clientName} {proposal.clientCompany && `(${proposal.clientCompany})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Describe the service or deliverable..."
                      rows={3}
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      min="0"
                      defaultValue="0"
                      placeholder="Display order (0 = first)"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
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