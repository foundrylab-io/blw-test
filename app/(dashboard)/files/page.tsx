import { db } from '@/lib/db/drizzle';
import { projectFiles, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, File, FileText, Image, Video, Music, Archive, Download, Trash2, FolderOpen } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Get all files with project and client info
  const filesData = await db
    .select({
      id: projectFiles.id,
      name: projectFiles.name,
      originalName: projectFiles.originalName,
      mimeType: projectFiles.mimeType,
      size: projectFiles.size,
      url: projectFiles.url,
      folder: projectFiles.folder,
      isPublic: projectFiles.isPublic,
      createdAt: projectFiles.createdAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(projectFiles)
    .leftJoin(projects, eq(projectFiles.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projectFiles.userId, currentUser.id))
    .orderBy(desc(projectFiles.createdAt));

  // Get all projects for the select dropdown
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
    const folder = formData.get('folder') as string;
    const isPublic = formData.get('isPublic') === 'on';

    if (!projectId || !name || !originalName || !url) {
      return;
    }

    await db.insert(projectFiles).values({
      userId: currentUser.id,
      projectId: parseInt(projectId),
      name,
      originalName,
      mimeType: mimeType || 'application/octet-stream',
      size: parseInt(size) || 0,
      url,
      folder: folder || '',
      isPublic,
    });

    revalidatePath('/files');
  }

  async function deleteFile(formData: FormData) {
    'use server';

    const fileId = formData.get('fileId') as string;
    if (!fileId) return;

    await db
      .delete(projectFiles)
      .where(eq(projectFiles.id, parseInt(fileId)));

    revalidatePath('/files');
  }

  function getFileIcon(mimeType: string | null) {
    if (!mimeType) return File;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return File;
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Files</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload New File</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadFile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project</option>
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder">Folder (optional)</Label>
                <Input id="folder" name="folder" placeholder="e.g. designs, documents" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">File Name</Label>
                <Input id="name" name="name" required placeholder="Display name for the file" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalName">Original File Name</Label>
                <Input id="originalName" name="originalName" required placeholder="actual_filename.pdf" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">File URL</Label>
                <Input id="url" name="url" required placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mimeType">MIME Type</Label>
                <Input id="mimeType" name="mimeType" placeholder="image/jpeg, application/pdf" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">File Size (bytes)</Label>
                <Input id="size" name="size" type="number" placeholder="1024" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="isPublic" name="isPublic" className="rounded" />
              <Label htmlFor="isPublic">Make file publicly accessible</Label>
            </div>
            <Button type="submit">Upload File</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Files ({filesData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filesData.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No files uploaded yet. Upload your first file to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filesData.map((file) => {
                  const FileIcon = getFileIcon(file.mimeType);
                  return (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{file.name}</div>
                            <div className="text-sm text-gray-500">{file.originalName}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{file.projectName ?? 'N/A'}</TableCell>
                      <TableCell>{file.clientName ?? 'N/A'}</TableCell>
                      <TableCell>
                        {(file.folder ?? '') === '' ? (
                          <span className="text-gray-400">Root</span>
                        ) : (
                          <span className="bg-gray-100 px-2 py-1 rounded-md text-sm">{file.folder}</span>
                        )}
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }).format(new Date(file.createdAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-3 w-3" />
                            </a>
                          </Button>
                          <form action={deleteFile} className="inline">
                            <input type="hidden" name="fileId" value={file.id.toString()} />
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}