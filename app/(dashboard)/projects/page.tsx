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
import { Plus, FolderOpen, User, Calendar, Activity } from 'lucide-react';

export default async function ProjectsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const [projectsList, clientsList] = await Promise.all([
    db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        createdAt: projects.createdAt,
        clientName: clients.name,
        clientCompany: clients.company,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.createdAt)),
    db
      .select()
      .from(clients)
      .where(eq(clients.userId, user.id))
      .orderBy(clients.name)
  ]);

  async function createProject(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const clientId = formData.get('clientId') as string;
    const status = formData.get('status') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (!name || !clientId) return;

    await db.insert(projects).values({
      userId: user.id,
      clientId: parseInt(clientId),
      name: name.trim(),
      description: description?.trim() || null,
      status: status || 'active',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });

    revalidatePath('/projects');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-gray-600 mt-1">Manage your client projects and track progress</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                All Projects ({projectsList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No projects yet</p>
                  <p>Create your first project to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectsList.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">{project.clientName}</div>
                              {project.clientCompany && (
                                <div className="text-xs text-gray-500">{project.clientCompany}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            <Activity className="h-3 w-3 mr-1" />
                            {project.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {project.startDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(project.startDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {project.endDate ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(project.endDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
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
                <Plus className="h-5 w-5" />
                Create New Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clientsList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium mb-1">No clients found</p>
                  <p className="text-xs">Add a client first to create projects</p>
                </div>
              ) : (
                <form action={createProject} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Website Redesign"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientId">Client *</Label>
                    <select
                      id="clientId"
                      name="clientId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Select a client</option>
                      {clientsList.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}{client.company ? ` (${client.company})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Brief description of the project"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="active">Active</option>
                      <option value="on-hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                  <Button type="submit" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
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