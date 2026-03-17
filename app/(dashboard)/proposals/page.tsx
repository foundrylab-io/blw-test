import { db } from '@/lib/db/drizzle';
import { proposals, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const proposalData = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      totalAmount: proposals.totalAmount,
      validUntil: proposals.validUntil,
      sentAt: proposals.sentAt,
      acceptedAt: proposals.acceptedAt,
      createdAt: proposals.createdAt,
      projectName: projects.name,
      clientName: clients.companyName,
    })
    .from(proposals)
    .innerJoin(projects, eq(proposals.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  const projectsData = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.companyName,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt));

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const projectId = parseInt(formData.get('projectId') as string);
    const validUntil = formData.get('validUntil') as string;
    
    if (!title || !projectId) {
      return;
    }
    
    await db.insert(proposals).values({
      userId: currentUser.id,
      projectId,
      title,
      description: description || '',
      status: 'draft',
      validUntil: validUntil ? new Date(validUntil) : null,
      totalAmount: '0',
    });
    
    revalidatePath('/proposals');
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <div className="flex items-center space-x-2">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Proposal
          </Button>
        </div>
      </div>

      {/* Create Proposal Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProposal} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Enter proposal title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a project</option>
                  {projectsData.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} - {project.clientName}
                    </option>
                  ))}
                </select>
              </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Enter proposal description"
              />
            </div>
            <Button type="submit">Create Proposal</Button>
          </form>
        </CardContent>
      </Card>

      {/* Proposals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {proposalData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No proposals yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Get started by creating your first proposal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalData.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(proposal.status ?? 'draft')}
                          <span className="text-sm">
                            {formatStatus(proposal.status ?? 'draft')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {proposal.title ?? ''}
                      </TableCell>
                      <TableCell>{proposal.projectName ?? ''}</TableCell>
                      <TableCell>{proposal.clientName ?? ''}</TableCell>
                      <TableCell>
                        ${(parseFloat(proposal.totalAmount ?? '0')).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {proposal.validUntil 
                          ? new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }).format(new Date(proposal.validUntil))
                          : 'No expiry'
                        }
                      </TableCell>
                      <TableCell>
                        {proposal.sentAt 
                          ? new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }).format(new Date(proposal.sentAt))
                          : 'Not sent'
                        }
                      </TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }).format(new Date(proposal.createdAt))}
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