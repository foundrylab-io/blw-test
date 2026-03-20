import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Palette, Building, Globe, Eye, Edit, Trash2 } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const brandingConfigs = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .orderBy(desc(agencyBranding.createdAt));

  async function createBranding(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string;
    const primaryColor = formData.get('primaryColor') as string || '#000000';
    const secondaryColor = formData.get('secondaryColor') as string || '#ffffff';
    const logoUrl = formData.get('logoUrl') as string || '';
    const faviconUrl = formData.get('faviconUrl') as string || '';
    const customDomain = formData.get('customDomain') as string || '';
    const isActive = formData.get('isActive') === 'on';
    
    if (!agencyName) {
      return;
    }

    await db.insert(agencyBranding).values({
      userId: currentUser.id,
      agencyName,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      customDomain,
      isActive,
    });

    revalidatePath('/branding');
  }

  async function toggleActive(formData: FormData) {
    'use server';
    
    const brandingId = parseInt(formData.get('brandingId') as string);
    const currentStatus = formData.get('currentStatus') === 'true';
    
    if (!brandingId) return;

    await db
      .update(agencyBranding)
      .set({ isActive: !currentStatus })
      .where(eq(agencyBranding.id, brandingId));
    
    revalidatePath('/branding');
  }

  async function deleteBranding(formData: FormData) {
    'use server';
    
    const brandingId = parseInt(formData.get('brandingId') as string);
    if (!brandingId) return;

    await db.delete(agencyBranding).where(eq(agencyBranding.id, brandingId));
    revalidatePath('/branding');
  }

  const activeBranding = brandingConfigs.find(b => b.isActive ?? false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Agency Branding</h1>
          <p className="text-gray-600">Customize your agency's brand appearance</p>
        </div>
      </div>

      {activeBranding && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Eye className="h-5 w-5" />
              Active Branding Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: activeBranding.primaryColor ?? '#000000' }}>
                    {activeBranding.agencyName ?? 'Agency Name'}
                  </h3>
                  <p className="text-sm text-gray-600">Primary Color: {activeBranding.primaryColor ?? '#000000'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded border-2"
                    style={{ backgroundColor: activeBranding.primaryColor ?? '#000000' }}
                  ></div>
                  <div 
                    className="w-12 h-12 rounded border-2"
                    style={{ backgroundColor: activeBranding.secondaryColor ?? '#ffffff' }}
                  ></div>
                </div>
                {activeBranding.customDomain && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">{activeBranding.customDomain}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {activeBranding.logoUrl && (
                  <div>
                    <p className="text-sm font-medium">Logo:</p>
                    <img 
                      src={activeBranding.logoUrl} 
                      alt="Agency Logo" 
                      className="h-16 max-w-full object-contain border rounded"
                    />
                  </div>
                )}
                {activeBranding.faviconUrl && (
                  <div>
                    <p className="text-sm font-medium">Favicon:</p>
                    <img 
                      src={activeBranding.faviconUrl} 
                      alt="Favicon" 
                      className="h-8 w-8 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Branding Config
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBranding} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  placeholder="My Digital Agency"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue="#000000"
                      className="w-16 h-10"
                    />
                    <Input
                      name="primaryColor"
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      defaultValue="#ffffff"
                      className="w-16 h-10"
                    />
                    <Input
                      name="secondaryColor"
                      placeholder="#ffffff"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  name="faviconUrl"
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <Input
                  id="customDomain"
                  name="customDomain"
                  placeholder="agency.com"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  className="rounded"
                />
                <Label htmlFor="isActive">Set as active branding</Label>
              </div>
              
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Branding
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Branding Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Configs:</span>
              <span className="font-semibold">{brandingConfigs.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Config:</span>
              <span className="font-semibold">
                {activeBranding ? activeBranding.agencyName ?? 'Unnamed' : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Custom Domain:</span>
              <span className="font-semibold">
                {activeBranding?.customDomain || 'Not set'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            All Branding Configurations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {brandingConfigs.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No branding configurations yet</h3>
              <p className="text-gray-600">Create your first branding configuration to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency Name</TableHead>
                    <TableHead>Colors</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandingConfigs.map((branding) => (
                    <TableRow key={branding.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          {branding.agencyName ?? 'Untitled'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: branding.primaryColor ?? '#000000' }}
                          ></div>
                          <div 
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: branding.secondaryColor ?? '#ffffff' }}
                          ></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {branding.customDomain ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {branding.customDomain}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {branding.logoUrl && (
                            <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Logo</span>
                          )}
                          {branding.faviconUrl && (
                            <span className="text-xs px-1 py-0.5 bg-green-100 text-green-800 rounded">Favicon</span>
                          )}
                          {!branding.logoUrl && !branding.faviconUrl && (
                            <span className="text-gray-400">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          branding.isActive ?? false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(branding.isActive ?? false) ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {branding.createdAt ? new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(new Date(branding.createdAt)) : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <form action={toggleActive} className="inline">
                            <input type="hidden" name="brandingId" value={branding.id} />
                            <input type="hidden" name="currentStatus" value={(branding.isActive ?? false).toString()} />
                            <button
                              type="submit"
                              className="text-blue-600 hover:text-blue-800"
                              title={(branding.isActive ?? false) ? 'Deactivate' : 'Activate'}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </form>
                          <form action={deleteBranding} className="inline">
                            <input type="hidden" name="brandingId" value={branding.id} />
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