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
import { Plus, FileText, Eye, CheckCircle, Clock } from 'lucide-react';

export default async function ProposalsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [proposalsData, clientsData, projectsData] = await Promise.all([
    db.select().from(proposals).where(eq(proposals.userId, currentUser.id)).orderBy(desc(proposals.createdAt)),
    db.select().from(clients).where(eq(clients.userId, currentUser.id)),
    db.select().from(projects).where(eq(projects.userId, currentUser.id))
  ]);

  async function createProposal(formData: FormData) {
    'use server';
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const clientId = parseInt(formData.get('clientId') as string);
    const projectId = formData.get('projectId') ? parseInt(formData.get('projectId') as string) : null;
    const validUntil = formData.get('validUntil') as string;
    
    await db.insert(proposals).values({
      userId: currentUser.id,
      title,
      description,
      clientId,
      projectId,
      validUntil: validUntil ? new Date(validUntil) : null,
      status: 'draft',
      total: '0'
    });
    
    revalidatePath('/proposals');
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'sent':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'viewed':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";
    switch (status) {
      case 'draft':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'viewed':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'accepted':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Proposals</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Proposal
        </Button>
      </div>

      {proposalsData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals yet</h3>
            <p className="text-gray-600 mb-6">Create your first proposal to get started with client work.</p>
            <form action={createProposal} className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="title">Proposal Title</Label>
                <Input id="title" name="title" required placeholder="Website redesign proposal" />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Brief description of the proposal" />
              </div>
              <div>
                <Label htmlFor="clientId">Client</Label>
                <select id="clientId" name="clientId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a client</option>
                  {clientsData.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <select id="projectId" name="projectId" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a project</option>
                  {projectsData.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                <Input id="validUntil" name="validUntil" type="date" />
              </div>
              <Button type="submit" className="w-full">
                Create Proposal
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProposal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Proposal Title</Label>
                  <Input id="title" name="title" required placeholder="Website redesign proposal" />
                </div>
                <div>
                  <Label htmlFor="clientId">Client</Label>
                  <select id="clientId" name="clientId" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a client</option>
                    {clientsData.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company && `(${client.company})`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Brief description of the proposal" />
                </div>
                <div>
                  <Label htmlFor="projectId">Project (Optional)</Label>
                  <select id="projectId" name="projectId" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a project</option>
                    {projectsData.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until (Optional)</Label>
                  <Input id="validUntil" name="validUntil" type="date" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Proposal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposalsData.map((proposal) => {
                    const client = clientsData.find(c => c.id === proposal.clientId);
                    return (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(proposal.status)}
                            <span className={getStatusBadge(proposal.status)}>
                              {proposal.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{proposal.title}</TableCell>
                        <TableCell>
                          {client ? (
                            <div>
                              <div className="font-medium">{client.name}</div>
                              {client.company && <div className="text-sm text-gray-500">{client.company}</div>}
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown Client</span>
                          )}
                        </TableCell>
                        <TableCell>${proposal.total}</TableCell>
                        <TableCell>
                          {proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString() : 'No expiry'}
                        </TableCell>
                        <TableCell>{new Date(proposal.createdAt).toLocaleDateString()}</TableCell>
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