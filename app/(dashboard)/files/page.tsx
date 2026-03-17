import { db } from '@/lib/db/drizzle';
import { projectFiles, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, File, Download, Eye, EyeOff, FileText, Image, Video, Archive } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const files = await db
    .select({
      id: projectFiles.id,
      fileName: projectFiles.fileName,
      originalName: projectFiles.originalName,
      fileSize: projectFiles.fileSize,
      mimeType: projectFiles.mimeType,
      fileUrl: projectFiles.fileUrl,
      isPublic: projectFiles.isPublic,
      uploadedAt: projectFiles.uploadedAt,
      projectName: projects.name,
      clientName: clients.companyName,
    })
    .from(projectFiles)
    .innerJoin(projects, eq(projectFiles.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projectFiles.userId, currentUser.id))
    .orderBy(desc(projectFiles.uploadedAt));

  const projectsList = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.companyName,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function createFile(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const fileName = formData.get('fileName') as string;
    const originalName = formData.get('originalName') as string;
    const fileSize = parseInt(formData.get('fileSize') as string) || 0;
    const mimeType = formData.get('mimeType') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const isPublic = formData.get('isPublic') === 'on';

    if (!projectId || !fileName || !originalName || !mimeType || !fileUrl) {
      return;
    }

    await db.insert(projectFiles).values({
      userId: currentUser.id,
      projectId,
      fileName,
      originalName,
      fileSize,
      mimeType,
      fileUrl,
      isPublic,
    });

    revalidatePath('/files');
  }

  function getFileIcon(mimeType: string | null) {
    if (!mimeType) return <File className="h-4 w-4" />;
    
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive className="h-4 w-4" />;
    
    return <File className="h-4 w-4" />;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files</h1>
          <p className="text-muted-foreground">Upload and manage files for your projects.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Upload New File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project...</option>
                  {projectsList.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.clientName})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  name="fileName"
                  placeholder="document.pdf"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originalName">Original Name</Label>
                <Input
                  id="originalName"
                  name="originalName"
                  placeholder="My Document.pdf"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fileUrl">File URL</Label>
                <Input
                  id="fileUrl"
                  name="fileUrl"
                  type="url"
                  placeholder="https://example.com/files/document.pdf"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="fileSize">File Size (bytes)</Label>
                <Input
                  id="fileSize"
                  name="fileSize"
                  type="number"
                  placeholder="1024"
                  min="0"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPublic">Make file publicly accessible</Label>
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
          <CardTitle>Files ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        <div>
                          <div className="font-medium">{file.originalName ?? ''}</div>
                          <div className="text-sm text-muted-foreground">{file.fileName ?? ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{file.projectName ?? ''}</TableCell>
                    <TableCell>{file.clientName ?? ''}</TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        {(file.isPublic ?? false) ? (
                          <>
                            <Eye className="h-3 w-3" />
                            Public
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" />
                            Private
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ''}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={file.fileUrl ?? ''} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p>No files uploaded yet.</p>
              <p className="text-sm">Upload your first project file using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}