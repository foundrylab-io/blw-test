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
import { Plus, FileText, Eye, DollarSign } from 'lucide-react';

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
      acceptedAt: proposals.acceptedAt,
      createdAt: proposals.createdAt,
      clientName: clients.name,
      clientCompany: clients.company,
      projectName: projects.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .leftJoin(projects, eq(proposals.projectId, projects.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt));

  const clientsList = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  const projectsList = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const description = formData.get('description') as string;
    const validUntil = formData.get('validUntil') ? new Date(formData.get('validUntil') as string) : null;
    
    if (!title || !clientId) {
      return;
    }

    await db.insert(proposals).values({
      userId: currentUser.id,
      title,
      clientId,
      projectId,
      description: description ?? '',
      validUntil
    });
    
    revalidatePath('/proposals');
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage project proposals for your clients
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Proposal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {proposalsList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  All Proposals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposalsList.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">
                          {proposal.title ?? 'Untitled'}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{proposal.clientName ?? 'Unknown'}</div>
                            {proposal.clientCompany && (
                              <div className="text-sm text-muted-foreground">
                                {proposal.clientCompany}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{proposal.projectName ?? 'No Project'}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                            {(proposal.status ?? 'draft').charAt(0).toUpperCase() + (proposal.status ?? 'draft').slice(1)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            {(proposal.totalAmount ?? '0')}
                          </div>
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
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No proposals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first proposal to get started with client work
                </p>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Proposal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProposal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Website Redesign Proposal"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <select
                    id="clientId"
                    name="clientId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a client</option>
                    {clientsList.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <select
                    id="projectId"
                    name="projectId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">No project</option>
                    {projectsList.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the proposal..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="date"
                  />
                </div>

                <Button type="submit" className="w-full">
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