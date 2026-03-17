import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Globe, Image, Settings } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch existing branding settings
  const existingBranding = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .limit(1);

  const branding = existingBranding[0] || null;

  async function updateBranding(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const faviconUrl = formData.get('faviconUrl') as string;
    const customDomain = formData.get('customDomain') as string;
    const isActive = formData.get('isActive') === 'on';

    const brandingData = {
      userId: currentUser.id,
      agencyName: agencyName || null,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      customDomain: customDomain || null,
      isActive,
      updatedAt: new Date(),
    };

    if (branding) {
      // Update existing branding
      await db
        .update(agencyBranding)
        .set(brandingData)
        .where(eq(agencyBranding.id, branding.id));
    } else {
      // Create new branding
      await db.insert(agencyBranding).values({
        ...brandingData,
        createdAt: new Date(),
      });
    }

    revalidatePath('/branding');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Branding</h1>
          <p className="text-muted-foreground">
            Customize your agency's appearance and white-label settings
          </p>
        </div>
      </div>

      {/* Current Branding Preview */}
      {branding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Current Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Agency Details</h3>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {branding.agencyName || 'Not set'}</p>
                    <p><strong>Domain:</strong> {branding.customDomain || 'Not set'}</p>
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        branding.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {branding.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Color Scheme</h3>
                  <div className="flex gap-4">
                    {branding.primaryColor && (
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-lg border border-gray-200 mb-2"
                          style={{ backgroundColor: branding.primaryColor ?? undefined }}
                        ></div>
                        <p className="text-xs text-gray-500">Primary</p>
                      </div>
                    )}
                    {branding.secondaryColor && (
                      <div className="text-center">
                        <div 
                          className="w-12 h-12 rounded-lg border border-gray-200 mb-2"
                          style={{ backgroundColor: branding.secondaryColor ?? undefined }}
                        ></div>
                        <p className="text-xs text-gray-500">Secondary</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branding Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {branding ? 'Update Branding' : 'Setup Agency Branding'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBranding} className="space-y-6">
            {/* Agency Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Agency Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    name="agencyName"
                    defaultValue={branding?.agencyName || ''}
                    placeholder="Your Agency Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    name="customDomain"
                    defaultValue={branding?.customDomain || ''}
                    placeholder="your-agency.com"
                  />
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue={branding?.primaryColor || '#3b82f6'}
                      className="w-16"
                    />
                    <Input
                      defaultValue={branding?.primaryColor || '#3b82f6'}
                      placeholder="#3b82f6"
                      className="flex-1"
                      onChange={(e) => {
                        const colorInput = document.getElementById('primaryColor') as HTMLInputElement;
                        if (colorInput) colorInput.value = e.target.value;
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      defaultValue={branding?.secondaryColor || '#64748b'}
                      className="w-16"
                    />
                    <Input
                      defaultValue={branding?.secondaryColor || '#64748b'}
                      placeholder="#64748b"
                      className="flex-1"
                      onChange={(e) => {
                        const colorInput = document.getElementById('secondaryColor') as HTMLInputElement;
                        if (colorInput) colorInput.value = e.target.value;
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Assets */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Brand Assets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    defaultValue={branding?.logoUrl || ''}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="faviconUrl">Favicon URL</Label>
                  <Input
                    id="faviconUrl"
                    name="faviconUrl"
                    type="url"
                    defaultValue={branding?.faviconUrl || ''}
                    placeholder="https://example.com/favicon.ico"
                  />
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  defaultChecked={branding?.isActive || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive">Enable white-label branding</Label>
              </div>
              <p className="text-sm text-gray-500">
                When enabled, your custom branding will be applied across the platform.
              </p>
            </div>

            <Button type="submit" className="w-full">
              {branding ? 'Update Branding' : 'Save Branding Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}