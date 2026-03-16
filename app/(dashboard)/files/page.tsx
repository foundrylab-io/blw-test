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
import { FileText, Upload, Download, Trash2 } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Get all project files for the current user with project and client info
  const files = await db
    .select({
      id: projectFiles.id,
      fileName: projectFiles.fileName,
      originalName: projectFiles.originalName,
      fileSize: projectFiles.fileSize,
      mimeType: projectFiles.mimeType,
      fileUrl: projectFiles.fileUrl,
      description: projectFiles.description,
      isPublic: projectFiles.isPublic,
      uploadedAt: projectFiles.uploadedAt,
      projectName: projects.name,
      clientName: clients.name,
      projectId: projectFiles.projectId,
    })
    .from(projectFiles)
    .leftJoin(projects, eq(projectFiles.projectId, projects.id))
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projectFiles.userId, currentUser.id))
    .orderBy(desc(projectFiles.uploadedAt));

  // Get projects for the dropdown
  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      clientName: clients.name,
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(projects.name);

  async function uploadFile(formData: FormData) {
    'use server';
    
    const projectId = parseInt(formData.get('projectId') as string);
    const originalName = formData.get('originalName') as string;
    const description = formData.get('description') as string || null;
    const isPublic = formData.get('isPublic') === 'on';
    
    // In a real app, you'd handle file upload to cloud storage here
    // For demo purposes, we'll create a dummy file record
    const fileName = `file_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const fileUrl = `/uploads/${fileName}`;
    const fileSize = 1024; // Dummy size
    const mimeType = 'application/octet-stream'; // Would be determined from actual file
    
    if (!projectId || !originalName) {
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
      description,
      isPublic,
    });
    
    revalidatePath('/files');
  }

  async function deleteFile(formData: FormData) {
    'use server';
    
    const fileId = parseInt(formData.get('fileId') as string);
    
    await db.delete(projectFiles)
      .where(eq(projectFiles.id, fileId));
    
    revalidatePath('/files');
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Files</h1>
      </div>

      {userProjects.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadFile} className="space-y-4">
              <div>
                <Label htmlFor="projectId">Project</Label>
                <select 
                  id="projectId" 
                  name="projectId" 
                  required
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project...</option>
                  {userProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.clientName ? `(${project.clientName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="originalName">File Name</Label>
                <Input
                  type="text"
                  id="originalName"
                  name="originalName"
                  placeholder="document.pdf"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  type="text"
                  id="description"
                  name="description"
                  placeholder="Brief description of the file"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  className="rounded border-gray-300"
                />
                <Label htmlFor="isPublic">Make file public (visible to client)</Label>
              </div>
              
              <Button type="submit" className="w-full">
                Upload File
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="mx-auto h-12 w-12 mb-4 text-gray-300" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload your first file to get started</p>
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
                  <TableHead>Visibility</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p className="font-semibold">{file.originalName}</p>
                        {file.description && (
                          <p className="text-sm text-gray-500">{file.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{file.projectName || 'Unknown Project'}</TableCell>
                    <TableCell>{file.clientName || 'No Client'}</TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded ${
                        file.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {file.isPublic ? 'Public' : 'Private'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(file.fileUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <form action={deleteFile} className="inline">
                          <input type="hidden" name="fileId" value={file.id} />
                          <Button variant="outline" size="sm" type="submit">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
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