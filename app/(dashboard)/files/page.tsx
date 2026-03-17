import { db } from '@/lib/db/drizzle';
import { projectFiles, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Upload, Download, Calendar } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch project files with project and client info
  const files = await db
    .select({
      id: projectFiles.id,
      filename: projectFiles.filename,
      originalName: projectFiles.originalName,
      mimeType: projectFiles.mimeType,
      fileSize: projectFiles.fileSize,
      filePath: projectFiles.filePath,
      description: projectFiles.description,
      uploadedAt: projectFiles.uploadedAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(projectFiles)
    .innerJoin(projects, eq(projectFiles.projectId, projects.id))
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projectFiles.userId, currentUser.id))
    .orderBy(desc(projectFiles.uploadedAt));

  // Fetch projects for the dropdown
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
    })
    .from(projects)
    .innerJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function uploadFile(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const filename = formData.get('filename') as string;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const fileSize = parseInt(formData.get('fileSize') as string);
    const filePath = formData.get('filePath') as string;
    const description = formData.get('description') as string;
    
    if (!projectId || !filename || !originalName || !filePath) {
      return;
    }

    await db.insert(projectFiles).values({
      userId: currentUser.id,
      projectId,
      filename,
      originalName,
      mimeType: mimeType || null,
      fileSize: fileSize || null,
      filePath,
      description: description || null,
    });

    revalidatePath('/files');
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files</h1>
          <p className="text-muted-foreground">
            Manage and organize files across your projects
          </p>
        </div>
      </div>

      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadFile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectId">Project</Label>
                <select
                  id="projectId"
                  name="projectId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a project...</option>
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.clientName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="originalName">File Name</Label>
                <Input
                  id="originalName"
                  name="originalName"
                  required
                  placeholder="Enter file name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filename">System Filename</Label>
                <Input
                  id="filename"
                  name="filename"
                  required
                  placeholder="system-filename.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  name="filePath"
                  required
                  placeholder="/uploads/files/filename.pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mimeType">MIME Type</Label>
                <Input
                  id="mimeType"
                  name="mimeType"
                  placeholder="application/pdf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileSize">File Size (bytes)</Label>
                <Input
                  id="fileSize"
                  name="fileSize"
                  type="number"
                  placeholder="1048576"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                placeholder="Optional file description"
              />
            </div>
            <Button type="submit" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Files ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No files</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload your first project file to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{file.originalName}</div>
                        {file.description && (
                          <div className="text-sm text-gray-500">{file.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{file.projectName}</TableCell>
                    <TableCell>{file.clientName}</TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {file.mimeType || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="mr-1 h-3 w-3" />
                        {new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(file.uploadedAt))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
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