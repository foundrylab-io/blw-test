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

  const [itemsList, proposalsList] = await Promise.all([
    db.select({
      id: proposalItems.id,
      name: proposalItems.name,
      description: proposalItems.description,
      quantity: proposalItems.quantity,
      unitPrice: proposalItems.unitPrice,
      totalPrice: proposalItems.totalPrice,
      proposalTitle: proposals.title,
      clientName: clients.name,
      createdAt: proposalItems.createdAt
    })
    .from(proposalItems)
    .leftJoin(proposals, eq(proposalItems.proposalId, proposals.id))
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposalItems.userId, user.id))
    .orderBy(desc(proposalItems.createdAt)),
    
    db.select({
      id: proposals.id,
      title: proposals.title,
      clientName: clients.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, user.id))
  ]);

  async function createProposalItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const proposalId = parseInt(formData.get('proposalId') as string);
    const quantity = formData.get('quantity') as string;
    const unitPrice = formData.get('unitPrice') as string;
    
    if (!name || !proposalId || !quantity || !unitPrice) return;
    
    const quantityNum = parseFloat(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    const totalPrice = (quantityNum * unitPriceNum).toFixed(2);
    
    await db.insert(proposalItems).values({
      userId: user.id,
      proposalId,
      name,
      description,
      quantity,
      unitPrice,
      totalPrice
    });
    
    revalidatePath('/proposal-items');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Proposal Items</h1>
            <p className="text-gray-600 mt-2">Manage line items for your proposals</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Proposal Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposalItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Website Design"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="proposalId">Proposal</Label>
                  <select
                    id="proposalId"
                    name="proposalId"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a proposal...</option>
                    {proposalsList.map((proposal) => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.title} ({proposal.clientName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Item description..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
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
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Total Price</Label>
                  <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                    <span className="text-gray-500">Calculated automatically</span>
                  </div>
                </div>
              </div>
              <Button type="submit">Add Item</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Proposal Items</CardTitle>
          </CardHeader>
          <CardContent>
            {itemsList.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposal items yet</h3>
                <p className="text-gray-600">Add line items to your proposals to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.proposalTitle}</TableCell>
                      <TableCell>{item.clientName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <Calculator className="h-4 w-4 text-green-600" />
                          ${item.totalPrice}
                        </div>
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
    </div>
  );
}