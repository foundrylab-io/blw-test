import { db } from '@/lib/db/drizzle';
import { files, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const userFiles = await db
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
    .where(eq(files.userId, user.id))
    .orderBy(desc(files.createdAt));

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt));

  async function createFile(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const name = formData.get('name') as string;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const size = parseInt(formData.get('size') as string);
    const url = formData.get('url') as string;
    const description = formData.get('description') as string;
    
    if (!projectId || !name || !originalName || !size || !url) {
      return;
    }
    
    await db.insert(files).values({
      userId: user.id,
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

  async function deleteFile(formData: FormData) {
    'use server';
    
    const fileId = parseInt(formData.get('fileId') as string);
    
    await db.delete(files).where(eq(files.id, fileId));
    
    revalidatePath('/files');
  }

  function formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-gray-600 mt-2">Manage and organize your project files</p>
        </div>
      </div>

      {/* Add New File Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectId">Project *</Label>
              <select
                id="projectId"
                name="projectId"
                required
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a project...</option>
                {userProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} {project.clientName && `(${project.clientName})`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="name">Display Name *</Label>
              <Input id="name" name="name" required placeholder="e.g., Logo Design Final" />
            </div>
            <div>
              <Label htmlFor="originalName">Original Filename *</Label>
              <Input id="originalName" name="originalName" required placeholder="e.g., logo-final.png" />
            </div>
            <div>
              <Label htmlFor="mimeType">MIME Type</Label>
              <Input id="mimeType" name="mimeType" placeholder="e.g., image/png" />
            </div>
            <div>
              <Label htmlFor="size">File Size (bytes) *</Label>
              <Input id="size" name="size" type="number" required placeholder="e.g., 1024000" />
            </div>
            <div>
              <Label htmlFor="url">File URL *</Label>
              <Input id="url" name="url" required placeholder="https://example.com/file.png" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" placeholder="Optional description of the file" />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="w-full md:w-auto">
                <Upload className="h-4 w-4 mr-2" />
                Add File
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Files ({userFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userFiles.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-600">Upload your first file to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{file.name}</div>
                          <div className="text-sm text-gray-500">{file.originalName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{file.projectName}</TableCell>
                      <TableCell>{file.clientName || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                          {file.mimeType || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>{file.description || 'No description'}</TableCell>
                      <TableCell>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-xs font-medium hover:bg-green-200"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                          <form action={deleteFile} className="inline">
                            <input type="hidden" name="fileId" value={file.id} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
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