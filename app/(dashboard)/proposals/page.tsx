import { db } from '@/lib/db/drizzle';
import { proposals, clients, projects, proposalItems } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const proposalsList = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      totalAmount: proposals.totalAmount,
      validUntil: proposals.validUntil,
      sentAt: proposals.sentAt,
      createdAt: proposals.createdAt,
      clientName: clients.name,
      projectName: projects.name,
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  const clientsList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  const projectsList = await db
    .select({ id: projects.id, name: projects.name, clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string;
    const totalAmount = formData.get('totalAmount') as string;
    const validUntil = formData.get('validUntil') as string;

    if (!title || !clientId) return;

    await db.insert(proposals).values({
      userId: currentUser.id,
      title,
      description: description || '',
      clientId: parseInt(clientId),
      projectId: projectId ? parseInt(projectId) : null,
      totalAmount: totalAmount || '0',
      validUntil: validUntil ? new Date(validUntil) : null,
    });

    revalidatePath('/proposals');
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-50';
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground">
            Create and manage client proposals with line-item pricing
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Proposal
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Proposal</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProposal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Proposal title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select a client</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name ?? 'Unnamed Client'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select a project</option>
                    {projectsList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name ?? 'Unnamed Project'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Proposal description"
                />
              </div>

              <Button type="submit">
                Create Proposal
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Your Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proposalsList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                <p>No proposals yet</p>
                <p className="text-sm">Create your first proposal to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
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
                        {proposal.title ?? 'Untitled'}
                      </TableCell>
                      <TableCell>
                        {proposal.clientName ?? 'Unknown Client'}
                      </TableCell>
                      <TableCell>
                        {proposal.projectName ?? '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {(proposal.status ?? 'draft').charAt(0).toUpperCase() + (proposal.status ?? 'draft').slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(proposal.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatDate(proposal.validUntil)}
                      </TableCell>
                      <TableCell>
                        {formatDate(proposal.createdAt)}
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