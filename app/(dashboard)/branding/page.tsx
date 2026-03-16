import { db } from '@/lib/db/drizzle';
import { brandingSettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [existingBranding] = await db.select().from(brandingSettings)
    .where(eq(brandingSettings.userId, currentUser.id))
    .limit(1);

  async function updateBranding(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;

    if (existingBranding) {
      await db.update(brandingSettings)
        .set({
          agencyName: agencyName || null,
          primaryColor: primaryColor || '#3b82f6',
          logoUrl: logoUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(brandingSettings.id, existingBranding.id));
    } else {
      await db.insert(brandingSettings).values({
        userId: currentUser.id,
        agencyName: agencyName || null,
        primaryColor: primaryColor || '#3b82f6',
        logoUrl: logoUrl || null,
      });
    }

    revalidatePath('/branding');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branding Settings</h1>
          <p className="text-gray-600">Customize your agency's branding and appearance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateBranding} className="space-y-4">
              <div>
                <Label htmlFor="agencyName">Agency Name</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  defaultValue={existingBranding?.agencyName ?? ''}
                  placeholder="Your Agency Name"
                />
              </div>
              
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue={existingBranding?.primaryColor ?? '#3b82f6'}
                    className="w-20"
                  />
                  <Input
                    defaultValue={existingBranding?.primaryColor ?? '#3b82f6'}
                    placeholder="#3b82f6"
                    className="flex-1"
                    readOnly
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  defaultValue={existingBranding?.logoUrl ?? ''}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Building className="h-4 w-4 mr-2" />
                {existingBranding ? 'Update Branding' : 'Save Branding'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  {existingBranding?.logoUrl && (
                    <img 
                      src={existingBranding.logoUrl} 
                      alt="Logo" 
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">
                      {existingBranding?.agencyName || 'Your Agency Name'}
                    </h3>
                    <p className="text-sm text-gray-600">Agency branding preview</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div 
                    className="h-8 rounded"
                    style={{ backgroundColor: existingBranding?.primaryColor ?? '#3b82f6' }}
                  ></div>
                  <p className="text-sm text-gray-600">
                    Primary color: {existingBranding?.primaryColor ?? '#3b82f6'}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>This preview shows how your branding will appear in:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Proposals sent to clients</li>
                  <li>Invoice headers</li>
                  <li>Client-facing documents</li>
                  <li>Email templates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {existingBranding && (
        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Agency Name</Label>
                <p className="text-sm">{existingBranding.agencyName || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: existingBranding.primaryColor ?? '#3b82f6' }}
                  ></div>
                  <span className="text-sm">{existingBranding.primaryColor}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Logo</Label>
                <p className="text-sm">{existingBranding.logoUrl ? 'Uploaded' : 'Not set'}</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Created: {new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date(existingBranding.createdAt))}</p>
              <p>Updated: {new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric', 
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date(existingBranding.updatedAt))}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}