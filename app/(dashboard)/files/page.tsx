import { db } from '@/lib/db/drizzle';
import { files, projects, clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FilePlus, File as FileIcon, Download, Trash2, Folder, Calendar } from 'lucide-react';

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
      createdAt: files.createdAt,
      projectName: projects.name,
      clientName: clients.name,
    })
    .from(files)
    .leftJoin(projects, eq(files.projectId, projects.id))
    .leftJoin(clients, eq(files.clientId, clients.id))
    .where(eq(files.userId, currentUser.id))
    .orderBy(desc(files.createdAt));

  async function uploadFile(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const url = formData.get('url') as string;
    
    if (!name || !url) return;
    
    await db.insert(files).values({
      userId: currentUser.id,
      name,
      originalName: name,
      mimeType: 'application/octet-stream',
      size: 0,
      path: url,
      url,
    });
    
    revalidatePath('/files');
  }

  async function deleteFile(formData: FormData) {
    'use server';
    
    const fileId = parseInt(formData.get('fileId') as string);
    
    await db.delete(files).where(eq(files.id, fileId));
    
    revalidatePath('/files');
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize your project files
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5" />
              Upload New File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={uploadFile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">File Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter file name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">File URL</Label>
                  <Input
                    id="url"
                    name="url"
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <FilePlus className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Your Files ({userFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userFiles.length === 0 ? (
              <div className="text-center py-12">
                <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No files uploaded</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first file to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-4 w-4 text-muted-foreground" />
                            {file.originalName ?? 'Unnamed File'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800">
                            {(file.mimeType ?? 'unknown').split('/')[1]?.toUpperCase() ?? 'FILE'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatFileSize(file.size ?? 0)}
                        </TableCell>
                        <TableCell>
                          {file.projectName ? (
                            <span className="text-sm text-muted-foreground">
                              {file.projectName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No project</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {file.clientName ? (
                            <span className="text-sm text-muted-foreground">
                              {file.clientName}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No client</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Intl.DateTimeFormat('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            }).format(new Date(file.createdAt))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <a
                              href={file.url ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8"
                            >
                              <Download className="h-3 w-3" />
                            </a>
                            <form action={deleteFile} className="inline">
                              <input type="hidden" name="fileId" value={file.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
    </div>
  );
}