import { db } from '@/lib/db/drizzle';
import { projectFiles, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Upload } from 'lucide-react';

export default async function ProjectFilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [files, userProjects] = await Promise.all([
    db.select({
      id: projectFiles.id,
      fileName: projectFiles.fileName,
      fileUrl: projectFiles.fileUrl,
      fileSize: projectFiles.fileSize,
      mimeType: projectFiles.mimeType,
      description: projectFiles.description,
      createdAt: projectFiles.createdAt,
      projectName: projects.name,
    }).from(projectFiles)
      .innerJoin(projects, eq(projectFiles.projectId, projects.id))
      .where(eq(projectFiles.userId, currentUser.id))
      .orderBy(desc(projectFiles.createdAt)),
    db.select().from(projects).where(eq(projects.userId, currentUser.id))
  ]);

  async function createProjectFile(formData: FormData) {
    'use server';
    
    const projectId = formData.get('projectId') as string;
    const fileName = formData.get('fileName') as string;
    const fileUrl = formData.get('fileUrl') as string;
    const fileSize = formData.get('fileSize') as string;
    const mimeType = formData.get('mimeType') as string;
    const description = formData.get('description') as string;

    if (!projectId || !fileName || !fileUrl || !fileSize) {
      return;
    }

    await db.insert(projectFiles).values({
      userId: currentUser.id,
      projectId: parseInt(projectId),
      fileName,
      fileUrl,
      fileSize: parseInt(fileSize),
      mimeType: mimeType || null,
      description: description || null,
    });

    revalidatePath('/project-files');
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Files</h1>
          <p className="text-gray-600">Manage files across all your projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Project Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
                  <p className="text-gray-600">Upload your first project file to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-medium">{file.fileName}</div>
                              {file.description && (
                                <div className="text-sm text-gray-600">{file.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{file.projectName}</TableCell>
                          <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                          <TableCell>{file.mimeType || 'Unknown'}</TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }).format(new Date(file.createdAt))}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" asChild>
                              <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                View
                              </a>
                            </Button>
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProjectFile} className="space-y-4">
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
                      <option key={project.id} value={project.id.toString()}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="fileName">File Name</Label>
                  <Input
                    id="fileName"
                    name="fileName"
                    required
                    placeholder="document.pdf"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileUrl">File URL</Label>
                  <Input
                    id="fileUrl"
                    name="fileUrl"
                    type="url"
                    required
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                
                <div>
                  <Label htmlFor="fileSize">File Size (bytes)</Label>
                  <Input
                    id="fileSize"
                    name="fileSize"
                    type="number"
                    required
                    placeholder="1024"
                  />
                </div>
                
                <div>
                  <Label htmlFor="mimeType">MIME Type</Label>
                  <Input
                    id="mimeType"
                    name="mimeType"
                    placeholder="application/pdf"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Project deliverable..."
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}