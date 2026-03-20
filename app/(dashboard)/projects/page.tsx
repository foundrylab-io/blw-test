import { db } from '@/lib/db/drizzle';
import { projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Briefcase, User, DollarSign, Calendar, CircleDot } from 'lucide-react';

export default async function ProjectsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [projectList, clientList] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        createdAt: projects.createdAt,
        client: {
          id: clients.id,
          name: clients.name,
          company: clients.company
        }
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.userId, currentUser.id))
      .orderBy(desc(projects.createdAt)),
    db
      .select()
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .orderBy(desc(clients.createdAt))
  ]);

  async function createProject(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const status = formData.get('status') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const budget = formData.get('budget') as string;

    if (!name || !clientId) {
      return;
    }

    await db.insert(projects).values({
      userId: currentUser.id,
      clientId: parseInt(clientId),
      name,
      description: description || '',
      status: status || 'active',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      budget: budget || '0'
    });

    revalidatePath('/projects');
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'completed': return 'text-blue-600';
      case 'on-hold': return 'text-yellow-600';
      case 'cancelled': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatStatus = (status: string | null) => {
    switch (status) {
      case 'active': return 'Active';
      case 'completed': return 'Completed';
      case 'on-hold': return 'On Hold';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-gray-600">Create and track projects for your clients</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProject} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="clientId">Client *</Label>
                <select
                  id="clientId"
                  name="clientId"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select a client</option>
                  {clientList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name ?? 'Unknown'} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Enter project description"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Project
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project List</CardTitle>
          </CardHeader>
          <CardContent>
            {projectList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  No projects yet
                </h3>
                <p className="text-gray-600">
                  Create your first project to start tracking client work.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
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
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{project.name ?? 'Unknown Project'}</div>
                              {project.description && (
                                <div className="text-sm text-gray-500">
                                  {(project.description ?? '').substring(0, 50)}{(project.description ?? '').length > 50 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{project.client?.name ?? 'Unknown Client'}</div>
                              {project.client?.company && (
                                <div className="text-sm text-gray-500">{project.client.company}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-2 ${getStatusColor(project.status)}`}>
                            <CircleDot className="h-4 w-4" />
                            <span className="capitalize">{formatStatus(project.status)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>${(project.budget ?? 0).toString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                              {project.startDate && (
                                <div>
                                  Start: {new Intl.DateTimeFormat('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }).format(new Date(project.startDate))}
                                </div>
                              )}
                              {project.endDate && (
                                <div>
                                  End: {new Intl.DateTimeFormat('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  }).format(new Date(project.endDate))}
                                </div>
                              )}
                              {!project.startDate && !project.endDate && (
                                <span className="text-gray-500">No dates set</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {project.createdAt ? new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }).format(new Date(project.createdAt)) : 'Unknown'}
                          </span>
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
    </div>
  );
}