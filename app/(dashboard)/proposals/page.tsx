import { db } from '@/lib/db/drizzle';
import { proposals, clients, projects, proposalItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [proposalsList, clientsList] = await Promise.all([
    db
      .select({
        id: proposals.id,
        title: proposals.title,
        status: proposals.status,
        totalAmount: proposals.totalAmount,
        validUntil: proposals.validUntil,
        sentAt: proposals.sentAt,
        createdAt: proposals.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          company: clients.company,
        },
      })
      .from(proposals)
      .leftJoin(clients, eq(proposals.clientId, clients.id))
      .where(eq(proposals.userId, currentUser.id))
      .orderBy(desc(proposals.createdAt)),
    db
      .select({
        id: clients.id,
        name: clients.name,
        company: clients.company,
      })
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .orderBy(clients.name),
  ]);

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const description = formData.get('description') as string;
    const validUntil = formData.get('validUntil') as string;
    
    if (!title || !clientId) {
      return;
    }

    await db.insert(proposals).values({
      userId: currentUser.id,
      clientId,
      title,
      description: description || '',
      status: 'draft',
      totalAmount: '0',
      validUntil: validUntil ? new Date(validUntil) : null,
    });

    revalidatePath('/proposals');
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'sent':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Draft';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="text-gray-600">Manage your client proposals</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Recent Proposals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposalsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No proposals created yet</p>
                  <p className="text-sm">Create your first proposal to get started</p>
                </div>
              ) : (
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
                    {proposalsList.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">
                          {proposal.title ?? ''}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {proposal.client?.name ?? 'Unknown'}
                            </div>
                            {proposal.client?.company && (
                              <div className="text-sm text-gray-500">
                                {proposal.client.company}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(proposal.status)}
                            <span className="text-sm">
                              {getStatusText(proposal.status)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          ${(parseFloat(proposal.totalAmount ?? '0')).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {proposal.validUntil
                            ? new Date(proposal.validUntil).toLocaleDateString()
                            : 'No expiry'
                          }
                        </TableCell>
                        <TableCell>
                          {new Date(proposal.createdAt).toLocaleDateString()}
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
                New Proposal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProposal} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Website Redesign Proposal"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a client...</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the proposal..."
                  />
                </div>

                <div>
                  <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Proposal
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}