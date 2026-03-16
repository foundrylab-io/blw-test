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

  const [proposalItemsData, proposalsData, clientsData] = await Promise.all([
    db.select().from(proposalItems).where(eq(proposalItems.userId, currentUser.id)).orderBy(desc(proposalItems.id)),
    db.select().from(proposals).where(eq(proposals.userId, currentUser.id)),
    db.select().from(clients).where(eq(clients.userId, currentUser.id))
  ]);

  async function createProposalItem(formData: FormData) {
    'use server';
    
    const proposalId = parseInt(formData.get('proposalId') as string);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const quantity = formData.get('quantity') as string || '1';
    const rate = formData.get('rate') as string;
    
    const quantityNum = parseFloat(quantity);
    const rateNum = parseFloat(rate);
    const amount = (quantityNum * rateNum).toString();
    
    await db.insert(proposalItems).values({
      userId: currentUser.id,
      proposalId,
      name,
      description,
      quantity,
      rate,
      amount,
      sortOrder: 0
    });
    
    revalidatePath('/proposal-items');
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proposal Items</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {proposalItemsData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposal items yet</h3>
            <p className="text-gray-600 mb-6">Create your first proposal item to add line items to your proposals.</p>
            <form action={createProposalItem} className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="proposalId">Proposal</Label>
                <select id="proposalId" name="proposalId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a proposal</option>
                  {proposalsData.map((proposal) => {
                    const client = clientsData.find(c => c.id === proposal.clientId);
                    return (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.title} {client && `(${client.name})`}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" required placeholder="Website design" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Custom website design and development" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue="1" required />
                </div>
                <div>
                  <Label htmlFor="rate">Rate ($)</Label>
                  <Input id="rate" name="rate" type="number" step="0.01" required placeholder="100.00" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Proposal Item
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal Item</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProposalItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposalId">Proposal</Label>
                  <select id="proposalId" name="proposalId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a proposal</option>
                    {proposalsData.map((proposal) => {
                      const client = clientsData.find(c => c.id === proposal.clientId);
                      return (
                        <option key={proposal.id} value={proposal.id}>
                          {proposal.title} {client && `(${client.name})`}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" required placeholder="Website design" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Custom website design and development" />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" defaultValue="1" required />
                </div>
                <div>
                  <Label htmlFor="rate">Rate ($)</Label>
                  <Input id="rate" name="rate" type="number" step="0.01" required placeholder="100.00" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal Item
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Proposal Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalItemsData.map((item) => {
                    const proposal = proposalsData.find(p => p.id === item.proposalId);
                    const client = proposal ? clientsData.find(c => c.id === proposal.clientId) : null;
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          {proposal ? (
                            <div>
                              <div className="font-medium">{proposal.title}</div>
                              {client && <div className="text-sm text-gray-500">{client.name}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown Proposal</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-gray-600">{item.description || 'No description'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.rate}</TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <Calculator className="h-4 w-4 text-gray-400" />
                            ${item.amount}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}