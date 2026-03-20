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
import { Plus, File, Download, Trash2, Folder, Eye } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const allFiles = await db
    .select({
      id: files.id,
      name: files.name,
      originalName: files.originalName,
      mimeType: files.mimeType,
      size: files.size,
      url: files.url,
      folder: files.folder,
      isPublic: files.isPublic,
      createdAt: files.createdAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(files)
    .leftJoin(projects, eq(files.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(files.userId, currentUser.id))
    .orderBy(desc(files.createdAt));

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt));

  async function createFile(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const size = parseInt(formData.get('size') as string) || 0;
    const url = formData.get('url') as string;
    const folder = formData.get('folder') as string || '';
    const projectId = parseInt(formData.get('projectId') as string);
    const isPublic = formData.get('isPublic') === 'on';
    
    if (!name || !originalName || !mimeType || !url || !projectId) {
      return;
    }

    await db.insert(files).values({
      userId: currentUser.id,
      projectId,
      name,
      originalName,
      mimeType,
      size,
      url,
      folder,
      isPublic,
    });

    revalidatePath('/files');
  }

  async function deleteFile(formData: FormData) {
    'use server';
    
    const fileId = parseInt(formData.get('fileId') as string);
    if (!fileId) return;

    await db.delete(files).where(eq(files.id, fileId));
    revalidatePath('/files');
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-gray-600">Manage your project files</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Upload New File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createFile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Document"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="originalName">Original File Name</Label>
                <Input
                  id="originalName"
                  name="originalName"
                  placeholder="document.pdf"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mimeType">MIME Type</Label>
                <Input
                  id="mimeType"
                  name="mimeType"
                  placeholder="application/pdf"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">File Size (bytes)</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  placeholder="1024"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">File URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com/file.pdf"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                <Input
                  id="folder"
                  name="folder"
                  placeholder="documents"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a project</option>
                  {allProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name ?? 'Untitled Project'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  className="rounded"
                />
                <Label htmlFor="isPublic">Make file public</Label>
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Files:</span>
              <span className="font-semibold">{allFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Public Files:</span>
              <span className="font-semibold">
                {allFiles.filter(f => f.isPublic ?? false).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Size:</span>
              <span className="font-semibold">
                {formatFileSize(allFiles.reduce((sum, f) => sum + (f.size ?? 0), 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            All Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allFiles.length === 0 ? (
            <div className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
              <p className="text-gray-600">Upload your first file to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4" />
                          <div>
                            <div>{file.name ?? 'Untitled'}</div>
                            <div className="text-xs text-gray-500">
                              {file.originalName ?? ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{file.projectName ?? 'Unknown'}</TableCell>
                      <TableCell>{file.clientName ?? 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {file.folder || 'Root'}
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size ?? 0)}</TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {(file.mimeType ?? '').split('/').pop()?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          file.isPublic ?? false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(file.isPublic ?? false) ? 'Public' : 'Private'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {file.createdAt ? new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(new Date(file.createdAt)) : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={file.url ?? '#'}
                            download={file.originalName ?? 'file'}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <form action={deleteFile} className="inline">
                            <input type="hidden" name="fileId" value={file.id} />
                            <button
                              type="submit"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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