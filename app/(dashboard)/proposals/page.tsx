import { db } from '@/lib/db/drizzle';
import { proposals, clients, proposalLineItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Eye, Check, X } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [allProposals, allClients] = await Promise.all([
    db
      .select({
        id: proposals.id,
        title: proposals.title,
        description: proposals.description,
        status: proposals.status,
        totalAmount: proposals.totalAmount,
        validUntil: proposals.validUntil,
        sentAt: proposals.sentAt,
        acceptedAt: proposals.acceptedAt,
        rejectedAt: proposals.rejectedAt,
        clientName: clients.name,
        clientCompany: clients.company,
        createdAt: proposals.createdAt,
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.userId, currentUser.id))
      .orderBy(desc(proposals.createdAt)),
    db
      .select({ id: clients.id, name: clients.name, company: clients.company })
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .orderBy(clients.name),
  ]);

  async function createProposal(formData: FormData) {
    'use server';
    
    const clientId = formData.get('clientId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const validUntil = formData.get('validUntil') as string;

    if (!clientId || !title.trim()) return;

    await db.insert(proposals).values({
      userId: currentUser.id,
      clientId: parseInt(clientId),
      title: title.trim(),
      description: description?.trim() || null,
      validUntil: validUntil ? new Date(validUntil) : null,
      totalAmount: '0.00',
    });

    revalidatePath('/proposals');
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      expired: { label: 'Expired', color: 'bg-orange-100 text-orange-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-2">Create and manage client proposals</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Proposal
        </Button>
      </div>

      {allClients.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Proposal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a client...</option>
                    {allClients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}{client.company ? ` (${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input type="date" id="validUntil" name="validUntil" />
                </div>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input type="text" id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <Button type="submit" className="w-full">
                Create Proposal
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allProposals.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
              <p className="text-gray-500 mb-4">Create your first proposal to get started.</p>
              {allClients.length === 0 && (
                <p className="text-sm text-gray-400">You'll need to add clients first.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{proposal.title}</div>
                          {proposal.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {proposal.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{proposal.clientName}</div>
                          {proposal.clientCompany && (
                            <div className="text-sm text-gray-500">{proposal.clientCompany}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(proposal.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {proposal.validUntil ? formatDate(proposal.validUntil) : 'No expiry'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(proposal.createdAt)}
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