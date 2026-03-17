import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building, Globe } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch existing branding settings
  const brandingSettings = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .limit(1);

  const branding = brandingSettings[0] || null;

  async function updateBranding(formData: FormData) {
    'use server';
    const agencyName = formData.get('agencyName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const customDomain = formData.get('customDomain') as string;

    const brandingData = {
      userId: currentUser.id,
      agencyName: agencyName || null,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      logoUrl: logoUrl || null,
      customDomain: customDomain || null,
    };

    if (branding) {
      // Update existing branding
      await db
        .update(agencyBranding)
        .set({
          ...brandingData,
          updatedAt: new Date(),
        })
        .where(eq(agencyBranding.id, branding.id));
    } else {
      // Create new branding
      await db.insert(agencyBranding).values(brandingData);
    }

    revalidatePath('/branding');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Agency Branding</h1>
        <div className="flex items-center gap-2 text-gray-600">
          <Building className="h-5 w-5" />
          <span>Customize Your Brand</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateBranding} className="space-y-6">
              <div>
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  defaultValue={branding?.agencyName ?? ''}
                  placeholder="Enter your agency name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue={branding?.primaryColor ?? '#3b82f6'}
                      className="w-16 h-10"
                    />
                    <Input
                      defaultValue={branding?.primaryColor ?? '#3b82f6'}
                      placeholder="#3b82f6"
                      className="flex-1"
                      onChange={(e) => {
                        const colorInput = document.getElementById('primaryColor') as HTMLInputElement;
                        if (colorInput) colorInput.value = e.target.value;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      defaultValue={branding?.secondaryColor ?? '#6b7280'}
                      className="w-16 h-10"
                    />
                    <Input
                      defaultValue={branding?.secondaryColor ?? '#6b7280'}
                      placeholder="#6b7280"
                      className="flex-1"
                      onChange={(e) => {
                        const colorInput = document.getElementById('secondaryColor') as HTMLInputElement;
                        if (colorInput) colorInput.value = e.target.value;
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  defaultValue={branding?.logoUrl ?? ''}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="customDomain">Custom Domain</Label>
                <Input
                  id="customDomain"
                  name="customDomain"
                  defaultValue={branding?.customDomain ?? ''}
                  placeholder="youragency.com"
                />
              </div>

              <Button type="submit" className="w-full">
                Save Branding Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Logo Preview */}
              {branding?.logoUrl && (
                <div className="text-center">
                  <img
                    src={branding.logoUrl}
                    alt="Agency Logo"
                    className="max-h-16 mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Agency Name */}
              <div className="text-center">
                <h2 className="text-2xl font-bold" style={{ color: branding?.primaryColor ?? undefined }}>
                  {branding?.agencyName || 'Your Agency Name'}
                </h2>
              </div>

              {/* Color Palette */}
              <div className="space-y-2">
                <h3 className="font-semibold">Color Palette</h3>
                <div className="flex gap-4">
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded border mx-auto mb-1"
                      style={{ backgroundColor: branding?.primaryColor ?? '#3b82f6' }}
                    ></div>
                    <p className="text-xs">Primary</p>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-12 h-12 rounded border mx-auto mb-1"
                      style={{ backgroundColor: branding?.secondaryColor ?? '#6b7280' }}
                    ></div>
                    <p className="text-xs">Secondary</p>
                  </div>
                </div>
              </div>

              {/* Custom Domain */}
              {branding?.customDomain && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>{branding.customDomain}</span>
                </div>
              )}

              {/* Sample UI Elements */}
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-semibold">Sample Elements</h3>
                <div className="space-y-2">
                  <button
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: branding?.primaryColor ?? '#3b82f6' }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 rounded text-white font-medium ml-2"
                    style={{ backgroundColor: branding?.secondaryColor ?? '#6b7280' }}
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>

            {!branding && (
              <div className="text-center py-8 text-gray-500">
                <Building className="h-8 w-8 mx-auto mb-2" />
                <p>Configure your branding settings to see a preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {branding && (
        <Card>
          <CardHeader>
            <CardTitle>Branding Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>Last Updated:</strong>{' '}
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(branding.updatedAt)}
              </p>
              <p>
                <strong>Created:</strong>{' '}
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }).format(branding.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}