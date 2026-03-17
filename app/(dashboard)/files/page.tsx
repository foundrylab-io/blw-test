import { db } from '@/lib/db/drizzle';
import { files, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Download } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch files with project and client info
  const allFiles = await db
    .select({
      id: files.id,
      name: files.name,
      originalName: files.originalName,
      mimeType: files.mimeType,
      size: files.size,
      url: files.url,
      description: files.description,
      createdAt: files.createdAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(files)
    .leftJoin(projects, eq(files.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(files.userId, currentUser.id))
    .orderBy(desc(files.createdAt));

  // Fetch projects for the form
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createFile(formData: FormData) {
    'use server';
    const projectId = parseInt(formData.get('projectId') as string);
    const name = formData.get('name') as string;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const size = parseInt(formData.get('size') as string) || null;
    const url = formData.get('url') as string;
    const description = formData.get('description') as string;

    if (!name || !originalName || !url || !projectId) {
      return;
    }

    await db.insert(files).values({
      userId: currentUser.id,
      projectId,
      name,
      originalName,
      mimeType: mimeType || null,
      size,
      url,
      description: description || null,
    });

    revalidatePath('/files');
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Files</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a project</option>
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name ?? 'Unnamed Project'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="name">File Name</Label>
                <Input id="name" name="name" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originalName">Original Name</Label>
                <Input id="originalName" name="originalName" required />
              </div>
              <div>
                <Label htmlFor="mimeType">MIME Type</Label>
                <Input id="mimeType" name="mimeType" placeholder="e.g., application/pdf" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="size">Size (bytes)</Label>
                <Input id="size" name="size" type="number" />
              </div>
              <div>
                <Label htmlFor="url">File URL</Label>
                <Input id="url" name="url" type="url" required />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <Button type="submit">Upload File</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {allFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">Upload your first file to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{file.name ?? 'Unnamed File'}</div>
                        {file.description && (
                          <div className="text-sm text-gray-500">{file.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{file.projectName ?? 'No Project'}</TableCell>
                    <TableCell>{file.clientName ?? 'No Client'}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {file.mimeType ?? 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(file.createdAt)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={file.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
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