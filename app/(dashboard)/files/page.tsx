import { db } from '@/lib/db/drizzle';
import { files, projects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Upload, Download } from 'lucide-react';

export default async function FilesPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userFiles = await db
    .select({
      id: files.id,
      name: files.name,
      originalName: files.originalName,
      mimeType: files.mimeType,
      size: files.size,
      url: files.url,
      folder: files.folder,
      uploadedAt: files.uploadedAt,
      projectName: projects.name,
    })
    .from(files)
    .leftJoin(projects, eq(files.projectId, projects.id))
    .where(eq(files.userId, currentUser.id))
    .orderBy(desc(files.uploadedAt));

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
    
    const name = formData.get('name') as string;
    const originalName = formData.get('originalName') as string;
    const projectId = formData.get('projectId') as string;
    const url = formData.get('url') as string;
    const mimeType = formData.get('mimeType') as string;
    const size = formData.get('size') as string;
    const folder = formData.get('folder') as string;

    if (!name || !originalName || !projectId || !url) {
      return;
    }

    await db.insert(files).values({
      userId: currentUser.id,
      name,
      originalName,
      projectId: parseInt(projectId),
      url,
      mimeType: mimeType || null,
      size: size ? parseInt(size) : null,
      folder: folder || null,
    });

    revalidatePath('/files');
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-gray-600">Upload and manage project files</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadFile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">File Name</Label>
                  <Input id="name" name="name" placeholder="Enter file name" required />
                </div>
                <div>
                  <Label htmlFor="originalName">Original Name</Label>
                  <Input id="originalName" name="originalName" placeholder="Original filename" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectId">Project</Label>
                  <select id="projectId" name="projectId" className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="">Select a project</option>
                    {userProjects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="folder">Folder</Label>
                  <Input id="folder" name="folder" placeholder="Optional folder name" />
                </div>
              </div>
              <div>
                <Label htmlFor="url">File URL</Label>
                <Input id="url" name="url" placeholder="https://example.com/file.pdf" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mimeType">MIME Type</Label>
                  <Input id="mimeType" name="mimeType" placeholder="application/pdf" />
                </div>
                <div>
                  <Label htmlFor="size">Size (bytes)</Label>
                  <Input id="size" name="size" type="number" placeholder="1024" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </form>
          </CardContent>
        </Card>

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
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded</h3>
                <p className="text-gray-600">Upload your first file to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{file.name}</div>
                          <div className="text-sm text-gray-500">{file.originalName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{file.projectName || 'N/A'}</TableCell>
                      <TableCell>{file.folder || '-'}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {file.mimeType || 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
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
    </div>
  );
}