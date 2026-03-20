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
import { Plus, File, FileText, Image, Video, Music, Archive, Download, Trash2, Calendar } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const filesList = await db
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

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
    })
    .from(projects)
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function uploadFile(formData: FormData) {
    'use server';
    
    const projectId = formData.get('projectId') as string;
    const name = formData.get('name') as string;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const size = formData.get('size') as string;
    const url = formData.get('url') as string;
    const description = formData.get('description') as string;

    if (!projectId || !name || !originalName || !mimeType || !size || !url) {
      return;
    }

    await db.insert(files).values({
      userId: currentUser.id,
      projectId: parseInt(projectId),
      name,
      originalName,
      mimeType,
      size: parseInt(size),
      url,
      description: description || '',
    });

    revalidatePath('/files');
  }

  async function deleteFile(formData: FormData) {
    'use server';
    
    const fileId = formData.get('fileId') as string;
    if (!fileId) return;

    await db
      .delete(files)
      .where(eq(files.id, parseInt(fileId)));

    revalidatePath('/files');
  }

  function getFileIcon(mimeType: string) {
    if ((mimeType ?? '').startsWith('image/')) return Image;
    if ((mimeType ?? '').startsWith('video/')) return Video;
    if ((mimeType ?? '').startsWith('audio/')) return Music;
    if ((mimeType ?? '').includes('pdf')) return FileText;
    if ((mimeType ?? '').includes('zip') || (mimeType ?? '').includes('rar')) return Archive;
    return File;
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Files</h1>
      </div>

      {userProjects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Upload New File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadFile} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="File display name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="originalName">Original Filename</Label>
                <Input
                  id="originalName"
                  name="originalName"
                  placeholder="original-file.pdf"
                  required
                />
              </div>
              <div>
                <Label htmlFor="mimeType">MIME Type</Label>
                <Input
                  id="mimeType"
                  name="mimeType"
                  placeholder="application/pdf"
                  required
                />
              </div>
              <div>
                <Label htmlFor="size">File Size (bytes)</Label>
                <Input
                  id="size"
                  name="size"
                  type="number"
                  placeholder="1024"
                  required
                />
              </div>
              <div>
                <Label htmlFor="url">File URL</Label>
                <Input
                  id="url"
                  name="url"
                  placeholder="https://example.com/file.pdf"
                  required
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="File description (optional)"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
        </CardHeader>
        <CardContent>
          {filesList.length === 0 ? (
            <div className="text-center py-8">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {userProjects.length === 0
                  ? 'Create a project first to start uploading files'
                  : 'No files uploaded yet'}
              </p>
              {userProjects.length === 0 && (
                <p className="text-sm text-gray-400">
                  Files are organized by project. Create your first project to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesList.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType ?? '');
                    return (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <FileIcon className="w-5 h-5 text-gray-500" />
                            <div>
                              <div className="font-medium">{file.name ?? 'Unnamed File'}</div>
                              <div className="text-sm text-gray-500">{file.originalName ?? ''}</div>
                              {file.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {file.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {file.projectName ?? 'Unknown Project'}
                        </TableCell>
                        <TableCell>
                          {file.clientName ?? 'No Client'}
                        </TableCell>
                        <TableCell>
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {(file.mimeType ?? '').split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {file.createdAt
                              ? new Intl.DateTimeFormat('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }).format(new Date(file.createdAt))
                              : 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                            <form action={deleteFile} className="inline">
                              <input type="hidden" name="fileId" value={file.id} />
                              <button
                                type="submit"
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </form>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}