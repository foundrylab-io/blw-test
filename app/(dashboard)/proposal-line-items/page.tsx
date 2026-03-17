import { db } from '@/lib/db/drizzle';
import { proposalLineItems, proposals, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Hash } from 'lucide-react';

export default async function ProposalLineItemsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const lineItemsData = await db
    .select({
      id: proposalLineItems.id,
      name: proposalLineItems.name,
      description: proposalLineItems.description,
      quantity: proposalLineItems.quantity,
      unitPrice: proposalLineItems.unitPrice,
      totalPrice: proposalLineItems.totalPrice,
      sortOrder: proposalLineItems.sortOrder,
      createdAt: proposalLineItems.createdAt,
      proposalTitle: proposals.title,
      projectName: projects.name,
      clientName: clients.companyName,
    })
    .from(proposalLineItems)
    .innerJoin(proposals, eq(proposalLineItems.proposalId, proposals.id))
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(proposalLineItems.userId, currentUser.id))
    .orderBy(desc(proposalLineItems.createdAt));

  const proposalsData = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      projectName: projects.name,
      clientName: clients.companyName,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  async function createLineItem(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const proposalId = parseInt(formData.get('proposalId') as string);
    const quantity = parseInt(formData.get('quantity') as string) || 1;
    const unitPrice = parseFloat(formData.get('unitPrice') as string) || 0;
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0;
    
    if (!name || !proposalId) {
      return;
    }
    
    const totalPrice = quantity * unitPrice;
    
    await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId,
      name,
      description: description || '',
      quantity,
      unitPrice: unitPrice.toString(),
      totalPrice: totalPrice.toString(),
      sortOrder,
    });
    
    // Update proposal total
    const lineItems = await db
      .select({ totalPrice: proposalLineItems.totalPrice })
      .from(proposalLineItems)
      .where(eq(proposalLineItems.proposalId, proposalId));
    
    const newTotal = lineItems.reduce((sum, item) => sum + parseFloat(item.totalPrice ?? '0'), totalPrice);
    
    await db
      .update(proposals)
      .set({ totalAmount: newTotal.toString() })
      .where(eq(proposals.id, proposalId));
    
    revalidatePath('/proposal-line-items');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Proposal Line Items</h1>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Line Item
          </Button>
        </div>
      </div>

      {/* Create Line Item Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Line Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLineItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proposalId">Proposal</Label>
                <select
                  id="proposalId"
                  name="proposalId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a proposal</option>
                  {proposalsData.map((proposal) => (
                    <option key={proposal.id} value={proposal.id}>
                      {proposal.title} - {proposal.projectName} ({proposal.clientName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price ($)</Label>
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
              <div className="space-y-2">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Enter item description"
              />
            </div>
            <Button type="submit">Add Line Item</Button>
          </form>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {lineItemsData.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No line items yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by adding line items to your proposals.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Order
                      </div>
                    </TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Proposal</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItemsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">
                        {item.sortOrder ?? 0}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.name ?? ''}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.proposalTitle ?? ''}</TableCell>
                      <TableCell>{item.projectName ?? ''}</TableCell>
                      <TableCell>{item.clientName ?? ''}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity ?? 0}
                      </TableCell>
                      <TableCell>
                        ${(parseFloat(item.unitPrice ?? '0')).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(parseFloat(item.totalPrice ?? '0')).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }).format(new Date(item.createdAt))}
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