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
import { Plus, Package, Calculator } from 'lucide-react';

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
      unitPrice: proposalItems.unitPrice,
      totalPrice: proposalItems.totalPrice,
      sortOrder: proposalItems.sortOrder,
      createdAt: proposalItems.createdAt,
      proposalTitle: proposals.title,
      clientName: clients.name,
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
    const description = formData.get('description') as string;
    const proposalId = formData.get('proposalId') as string;
    const quantity = formData.get('quantity') as string;
    const unitPrice = formData.get('unitPrice') as string;
    const sortOrder = formData.get('sortOrder') as string;

    if (!name || !proposalId) return;

    const qty = parseFloat(quantity || '1');
    const price = parseFloat(unitPrice || '0');
    const total = qty * price;

    await db.insert(proposalItems).values({
      userId: currentUser.id,
      proposalId: parseInt(proposalId),
      name,
      description: description || '',
      quantity: quantity || '1',
      unitPrice: unitPrice || '0',
      totalPrice: total.toString(),
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
    });

    revalidatePath('/proposal-items');
  }

  const formatCurrency = (amount: string | null) => {
    const num = parseFloat(amount ?? '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposal Items</h1>
          <p className="text-muted-foreground">
            Manage line items for your proposals with pricing details
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Proposal Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposalItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Service or product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposalId">Proposal</Label>
                  <select
                    id="proposalId"
                    name="proposalId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    placeholder="1"
                    defaultValue="1"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    placeholder="0"
                    defaultValue="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Item description"
                />
              </div>

              <Button type="submit">
                Add Item
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Your Proposal Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {itemsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No proposal items yet</p>
                <p className="text-sm">Add items to your proposals to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.name ?? 'Unnamed Item'}
                      </TableCell>
                      <TableCell>
                        {item.proposalTitle ?? 'Unknown Proposal'}
                      </TableCell>
                      <TableCell>
                        {item.clientName ?? 'Unknown Client'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {parseFloat(item.quantity ?? '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}