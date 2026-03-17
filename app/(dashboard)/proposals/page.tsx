import { db } from '@/lib/db/drizzle';
import { proposals, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Eye, Check, Clock } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userProposals = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      totalAmount: proposals.totalAmount,
      validUntil: proposals.validUntil,
      sentAt: proposals.sentAt,
      viewedAt: proposals.viewedAt,
      acceptedAt: proposals.acceptedAt,
      createdAt: proposals.createdAt,
      clientName: clients.name,
      clientCompany: clients.company
    })
    .from(proposals)
    .innerJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  const userClients = await db
    .select({ id: clients.id, name: clients.name, company: clients.company })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  async function createProposal(formData: FormData) {
    'use server';
    
    const clientId = parseInt(formData.get('clientId') as string);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const validUntil = formData.get('validUntil') as string;

    await db.insert(proposals).values({
      userId: currentUser.id,
      clientId,
      title,
      description: description || null,
      totalAmount: totalAmount || '0',
      validUntil: validUntil ? new Date(validUntil) : null,
      status: 'draft'
    });

    revalidatePath('/proposals');
  }

  function getStatusIcon(status: string | null) {
    switch (status) {
      case 'sent': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'accepted': return <Check className="h-4 w-4 text-green-500" />;
      case 'rejected': return <span className="h-4 w-4 text-red-500">✕</span>;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }

  function getStatusBadge(status: string | null) {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'sent': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'accepted': return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected': return `${baseClasses} bg-red-100 text-red-800`;
      default: return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Proposals ({userProposals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userProposals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No proposals yet</p>
                  <p>Create your first proposal to get started with client work.</p>
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
                    {userProposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">{proposal.title}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proposal.clientName ?? ''}</div>
                            {proposal.clientCompany && (
                              <div className="text-sm text-muted-foreground">{proposal.clientCompany}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={getStatusBadge(proposal.status)}>
                            <span className="mr-1">{getStatusIcon(proposal.status)}</span>
                            {(proposal.status ?? 'draft').charAt(0).toUpperCase() + (proposal.status ?? 'draft').slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>${(parseFloat(proposal.totalAmount ?? '0')).toFixed(2)}</TableCell>
                        <TableCell>
                          {proposal.validUntil
                            ? new Date(proposal.validUntil).toLocaleDateString()
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
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
                Create Proposal
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userClients.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm mb-2">No clients available</p>
                  <p className="text-xs">Create a client first to send proposals.</p>
                </div>
              ) : (
                <form action={createProposal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client</Label>
                    <select
                      id="clientId"
                      name="clientId"
                      required
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="">Select a client...</option>
                      {userClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.company && `(${client.company})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Website Redesign Proposal"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Proposal overview and objectives..."
                      rows={3}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Amount</Label>
                    <Input
                      id="totalAmount"
                      name="totalAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      name="validUntil"
                      type="date"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
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