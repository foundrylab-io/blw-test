import { db } from '@/lib/db/drizzle';
import { brandingSettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building, Globe, Eye, Save } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  const userBranding = await db
    .select()
    .from(brandingSettings)
    .where(eq(brandingSettings.userId, user.id))
    .limit(1);

  const currentBranding = userBranding[0] || null;

  async function saveBranding(formData: FormData) {
    'use server';
    
    const companyName = formData.get('companyName') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const accentColor = formData.get('accentColor') as string;
    const customDomain = formData.get('customDomain') as string;
    const isEnabled = formData.get('isEnabled') === 'on';
    
    const brandingData = {
      userId: user.id,
      companyName: companyName || null,
      logoUrl: logoUrl || null,
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#64748B',
      accentColor: accentColor || '#10B981',
      customDomain: customDomain || null,
      isEnabled,
      updatedAt: new Date(),
    };
    
    if (currentBranding) {
      await db
        .update(brandingSettings)
        .set(brandingData)
        .where(eq(brandingSettings.id, currentBranding.id));
    } else {
      await db.insert(brandingSettings).values({
        ...brandingData,
        createdAt: new Date(),
      });
    }
    
    revalidatePath('/branding');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Branding Settings</h1>
          <p className="text-gray-600 mt-2">Customize your agency's branding and appearance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <form action={saveBranding} className="space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    defaultValue={currentBranding?.companyName || ''}
                    placeholder="Your Agency Name"
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    defaultValue={currentBranding?.logoUrl || ''}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="customDomain">Custom Domain</Label>
                  <Input
                    id="customDomain"
                    name="customDomain"
                    defaultValue={currentBranding?.customDomain || ''}
                    placeholder="clients.youragency.com"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Optional custom domain for client-facing pages
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Color Scheme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue={currentBranding?.primaryColor || '#3B82F6'}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      type="text"
                      defaultValue={currentBranding?.primaryColor || '#3B82F6'}
                      className="flex-1"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      defaultValue={currentBranding?.secondaryColor || '#64748B'}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      type="text"
                      defaultValue={currentBranding?.secondaryColor || '#64748B'}
                      className="flex-1"
                      placeholder="#64748B"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="accentColor"
                      name="accentColor"
                      type="color"
                      defaultValue={currentBranding?.accentColor || '#10B981'}
                      className="w-16 h-10 p-1 rounded border"
                    />
                    <Input
                      type="text"
                      defaultValue={currentBranding?.accentColor || '#10B981'}
                      className="flex-1"
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enable Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Branding Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEnabled"
                    name="isEnabled"
                    defaultChecked={currentBranding?.isEnabled || false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="isEnabled" className="font-medium">
                    Enable Custom Branding
                  </Label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  When enabled, your custom branding will be applied to client-facing pages like proposals and invoices.
                </p>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full md:w-auto">
              <Save className="h-4 w-4 mr-2" />
              Save Branding Settings
            </Button>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Logo Preview */}
                {currentBranding?.logoUrl && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-2">Logo</p>
                    <img
                      src={currentBranding.logoUrl}
                      alt="Logo Preview"
                      className="max-w-full h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Company Name Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-2">Company Name</p>
                  <h3 className="text-lg font-bold">
                    {currentBranding?.companyName || 'Your Agency Name'}
                  </h3>
                </div>

                {/* Color Scheme Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-3">Color Palette</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div
                        className="w-full h-8 rounded mb-1"
                        style={{ backgroundColor: currentBranding?.primaryColor || '#3B82F6' }}
                      ></div>
                      <p className="text-xs text-gray-600">Primary</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-8 rounded mb-1"
                        style={{ backgroundColor: currentBranding?.secondaryColor || '#64748B' }}
                      ></div>
                      <p className="text-xs text-gray-600">Secondary</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="w-full h-8 rounded mb-1"
                        style={{ backgroundColor: currentBranding?.accentColor || '#10B981' }}
                      ></div>
                      <p className="text-xs text-gray-600">Accent</p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium mb-2">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentBranding?.isEnabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {currentBranding?.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                {/* Custom Domain */}
                {currentBranding?.customDomain && (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm font-medium mb-2">Custom Domain</p>
                    <p className="text-sm text-gray-700">
                      {currentBranding.customDomain}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}