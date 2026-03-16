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
import { PlusCircle, List, DollarSign } from 'lucide-react';

export default async function ProposalItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch proposal items with proposal and client data
  const userProposalItems = await db
    .select({
      id: proposalItems.id,
      description: proposalItems.description,
      quantity: proposalItems.quantity,
      unitPrice: proposalItems.unitPrice,
      totalPrice: proposalItems.totalPrice,
      sortOrder: proposalItems.sortOrder,
      proposalTitle: proposals.title,
      clientName: clients.name,
      proposalId: proposalItems.proposalId,
    })
    .from(proposalItems)
    .leftJoin(proposals, eq(proposalItems.proposalId, proposals.id))
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposalItems.id));

  // Fetch user's proposals for the dropdown
  const userProposals = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      clientName: clients.name,
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(proposals.title);

  async function createProposalItem(formData: FormData) {
    'use server';

    const proposalId = parseInt(formData.get('proposalId') as string);
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string;
    const unitPrice = formData.get('unitPrice') as string;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;

    if (!proposalId || !description || !quantity || !unitPrice) {
      return;
    }

    const quantityNum = parseFloat(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    const totalPrice = (quantityNum * unitPriceNum).toString();

    await db.insert(proposalItems).values({
      proposalId,
      description,
      quantity,
      unitPrice,
      totalPrice,
      sortOrder,
    });

    // Update the proposal total amount
    const allItems = await db
      .select({ totalPrice: proposalItems.totalPrice })
      .from(proposalItems)
      .where(eq(proposalItems.proposalId, proposalId));
    
    const newTotalAmount = allItems.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) + parseFloat(totalPrice);
    
    await db
      .update(proposals)
      .set({ totalAmount: newTotalAmount.toString() })
      .where(eq(proposals.id, proposalId));

    revalidatePath('/proposal-items');
  }

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proposal Items</h1>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Add New Proposal Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposalItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposalId">Proposal</Label>
                  <select
                    id="proposalId"
                    name="proposalId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a proposal</option>
                    {userProposals.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.title} - {proposal.clientName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue="0"
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
                    defaultValue="1"
                    placeholder="1"
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
                    min="0"
                    placeholder="100.00"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the service or item..."
                  required
                />
              </div>
              <Button type="submit">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="w-5 h-5" />
            All Proposal Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userProposalItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <List className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No proposal items yet. Add your first item above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Sort Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userProposalItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.proposalTitle}</TableCell>
                    <TableCell>{item.clientName}</TableCell>
                    <TableCell className="max-w-xs truncate" title={item.description}>
                      {item.description}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.totalPrice)}
                    </TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
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