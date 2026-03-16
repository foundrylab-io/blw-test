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
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const [proposalsList, clientsList, projectsList] = await Promise.all([
    db.select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      totalAmount: proposals.totalAmount,
      sentAt: proposals.sentAt,
      acceptedAt: proposals.acceptedAt,
      rejectedAt: proposals.rejectedAt,
      expiresAt: proposals.expiresAt,
      clientName: clients.name,
      projectName: projects.name,
      createdAt: proposals.createdAt
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.userId, user.id))
    .orderBy(desc(proposals.createdAt)),
    
    db.select().from(clients).where(eq(clients.userId, user.id)),
    db.select().from(projects).where(eq(projects.userId, user.id))
  ]);

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const totalAmount = formData.get('totalAmount') as string;
    
    if (!title || !clientId || !totalAmount) return;
    
    await db.insert(proposals).values({
      userId: user.id,
      title,
      description,
      clientId,
      projectId,
      totalAmount,
      status: 'draft'
    });
    
    revalidatePath('/proposals');
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-gray-600 mt-2">Create and manage client proposals</p>
          </div>
        </div>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
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
                    placeholder="e.g., Website Redesign Proposal"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalAmount">Total Amount</Label>
                  <Input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Proposal description..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    className="w-full p-3 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select a client...</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="w-full p-3 border border-gray-300 rounded-md"
                  >
                    <option value="">No project selected</option>
                    {projectsList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button type="submit">Create Proposal</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            {proposalsList.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals yet</h3>
                <p className="text-gray-600">Create your first proposal to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalsList.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(proposal.status)}
                          <span className={getStatusBadge(proposal.status)}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{proposal.title}</TableCell>
                      <TableCell>{proposal.clientName}</TableCell>
                      <TableCell>{proposal.projectName || '-'}</TableCell>
                      <TableCell>${proposal.totalAmount}</TableCell>
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
    </div>
  );
}