import { db } from '@/lib/db/drizzle';
import { proposals, clients, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Calendar, DollarSign, User, Building, CheckCircle, XCircle, Clock } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const proposalList = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      total: proposals.total,
      validUntil: proposals.validUntil,
      sentAt: proposals.sentAt,
      acceptedAt: proposals.acceptedAt,
      rejectedAt: proposals.rejectedAt,
      createdAt: proposals.createdAt,
      clientName: clients.name,
      projectName: projects.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  const clientsList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.userId, currentUser.id));

  const projectsList = await db
    .select({ id: projects.id, name: projects.name, clientId: projects.clientId })
    .from(projects)
    .where(eq(projects.userId, currentUser.id));

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const projectId = formData.get('projectId') as string;
    const total = formData.get('total') as string;
    const validUntil = formData.get('validUntil') as string;

    if (!title || !clientId) return;

    await db.insert(proposals).values({
      userId: currentUser.id,
      title,
      description: description || '',
      clientId: parseInt(clientId),
      projectId: projectId ? parseInt(projectId) : null,
      total: total || '0',
      validUntil: validUntil ? new Date(validUntil) : null,
      status: 'draft'
    });

    revalidatePath('/proposals');
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-gray-600 mt-1">Manage your client proposals and pricing</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Proposal
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New Proposal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProposal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter proposal title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client</Label>
                <select
                  id="clientId"
                  name="clientId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  <option value="">Select a client</option>
                  {clientsList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <select
                  id="projectId"
                  name="projectId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">Select a project</option>
                  {projectsList.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name ?? 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="total">Total Amount</Label>
                <Input
                  id="total"
                  name="total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until</Label>
                <Input
                  id="validUntil"
                  name="validUntil"
                  type="date"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="Proposal description"
              />
            </div>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Proposal
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposalList.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
              <p className="text-gray-500 mb-4">Create your first proposal to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposalList.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(proposal.status ?? 'draft')}
                        <span className="capitalize">
                          {proposal.status ?? 'draft'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {proposal.title ?? 'Untitled'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        {proposal.clientName ?? 'Unknown'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {proposal.projectName ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          {proposal.projectName}
                        </div>
                      ) : (
                        <span className="text-gray-400">No project</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        ${(proposal.total ?? 0).toString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {proposal.validUntil ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Intl.DateTimeFormat('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }).format(new Date(proposal.validUntil))}
                        </div>
                      ) : (
                        <span className="text-gray-400">No expiry</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(new Date(proposal.createdAt))}
                    </TableCell>
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