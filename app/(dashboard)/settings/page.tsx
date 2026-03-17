import { db } from '@/lib/db/drizzle';
import { agencySettings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Building, Palette, Globe, Mail, Phone } from 'lucide-react';

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const settings = await db
    .select()
    .from(agencySettings)
    .where(eq(agencySettings.userId, currentUser.id))
    .limit(1);

  const currentSettings = settings[0] || null;

  async function updateSettings(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const website = formData.get('website') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const taxId = formData.get('taxId') as string;

    const settingsData = {
      userId: currentUser.id,
      agencyName: agencyName || '',
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#000000',
      secondaryColor: secondaryColor || '#ffffff',
      website: website || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
      taxId: taxId || '',
      updatedAt: new Date(),
    };

    if (currentSettings) {
      await db
        .update(agencySettings)
        .set(settingsData)
        .where(eq(agencySettings.id, currentSettings.id));
    } else {
      await db.insert(agencySettings).values(settingsData);
    }

    revalidatePath('/settings');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Settings</h1>
          <p className="text-muted-foreground">Customize your agency branding and contact information.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Agency Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateSettings} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    name="agencyName"
                    placeholder="Your Agency Name"
                    defaultValue={currentSettings?.agencyName ?? ''}
                  />
                </div>
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    defaultValue={currentSettings?.logoUrl ?? ''}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 text-sm text-gray-500 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                      <Globe className="h-4 w-4" />
                    </div>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      className="rounded-l-none"
                      defaultValue={currentSettings?.website ?? ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="taxId">Tax ID / Business Number</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    placeholder="123456789"
                    defaultValue={currentSettings?.taxId ?? ''}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Business St\nCity, State 12345\nCountry"
                  defaultValue={currentSettings?.address ?? ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 text-sm text-gray-500 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="contact@agency.com"
                      className="rounded-l-none"
                      defaultValue={currentSettings?.email ?? ''}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Contact Phone</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 text-sm text-gray-500 border border-r-0 border-gray-300 rounded-l-md bg-gray-50">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="rounded-l-none"
                      defaultValue={currentSettings?.phone ?? ''}
                    />
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Palette className="h-4 w-4" />
                    Brand Colors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="primaryColor"
                          name="primaryColor"
                          type="color"
                          className="w-16 h-10 p-1 border"
                          defaultValue={currentSettings?.primaryColor ?? '#000000'}
                        />
                        <Input
                          type="text"
                          placeholder="#000000"
                          className="flex-1"
                          defaultValue={currentSettings?.primaryColor ?? '#000000'}
                          onChange={(e) => {
                            const colorInput = document.getElementById('primaryColor') as HTMLInputElement;
                            if (colorInput) colorInput.value = e.target.value;
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="secondaryColor"
                          name="secondaryColor"
                          type="color"
                          className="w-16 h-10 p-1 border"
                          defaultValue={currentSettings?.secondaryColor ?? '#ffffff'}
                        />
                        <Input
                          type="text"
                          placeholder="#ffffff"
                          className="flex-1"
                          defaultValue={currentSettings?.secondaryColor ?? '#ffffff'}
                          onChange={(e) => {
                            const colorInput = document.getElementById('secondaryColor') as HTMLInputElement;
                            if (colorInput) colorInput.value = e.target.value;
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Color Preview</h4>
                    <div className="flex gap-2">
                      <div 
                        className="w-20 h-10 rounded border flex items-center justify-center text-xs font-medium"
                        style={{ 
                          backgroundColor: currentSettings?.primaryColor ?? '#000000',
                          color: currentSettings?.secondaryColor ?? '#ffffff'
                        }}
                      >
                        Primary
                      </div>
                      <div 
                        className="w-20 h-10 rounded border flex items-center justify-center text-xs font-medium"
                        style={{ 
                          backgroundColor: currentSettings?.secondaryColor ?? '#ffffff',
                          color: currentSettings?.primaryColor ?? '#000000',
                          border: `1px solid ${currentSettings?.primaryColor ?? '#000000'}`
                        }}
                      >
                        Secondary
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Current Settings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Agency:</span> {currentSettings.agencyName || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Website:</span> {currentSettings.website || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {currentSettings.email || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {currentSettings.phone || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {currentSettings.updatedAt ? new Date(currentSettings.updatedAt).toLocaleDateString() : 'Never'}
                </div>
                <div>
                  <span className="font-medium">Tax ID:</span> {currentSettings.taxId || 'Not set'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}