import { db } from '@/lib/db/drizzle';
import { projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Briefcase, Calendar, DollarSign } from 'lucide-react';

export default async function ProjectsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const projectList = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      budget: projects.budget,
      createdAt: projects.createdAt,
      clientName: clients.name,
      clientCompanyName: clients.companyName
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt));

  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(clients.name);

  async function createProject(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const budget = formData.get('budget') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (!name || !clientId) {
      return;
    }

    await db.insert(projects).values({
      userId: currentUser.id,
      clientId: parseInt(clientId),
      name,
      description: description || '',
      status: 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget: budget || '0'
    });

    revalidatePath('/projects');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your client projects and track their progress</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          {clientList.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No clients available</h3>
              <p className="mt-1 text-sm text-gray-500">You need to add clients first before creating projects.</p>
            </div>
          ) : (
            <form action={createProject} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input id="name" name="name" placeholder="Website Redesign" required />
              </div>
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <select id="clientId" name="clientId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select a client...</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name ?? 'Unknown'} {client.companyName ? `(${client.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input id="budget" name="budget" type="number" step="0.01" placeholder="5000.00" />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" placeholder="Project description and requirements..." />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full">
                  Create Project
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Projects ({projectList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {projectList.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first project above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectList.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.name ?? 'Unknown'}</div>
                        {project.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {project.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{project.clientName ?? 'Unknown Client'}</div>
                        {project.clientCompanyName && (
                          <div className="text-sm text-muted-foreground">{project.clientCompanyName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status ?? 'draft')}`}>
                        {(project.status ?? 'draft').charAt(0).toUpperCase() + (project.status ?? 'draft').slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {(parseFloat(project.budget ?? '0')).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {project.startDate && (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {project.endDate && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {!project.startDate && !project.endDate && (
                          <span className="text-sm text-muted-foreground">No dates set</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}
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