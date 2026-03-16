import { db } from '@/lib/db/drizzle';
import { branding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const userBranding = await db
    .select()
    .from(branding)
    .where(eq(branding.userId, currentUser.id))
    .limit(1);

  const currentBranding = userBranding[0] || null;

  async function updateBranding(formData: FormData) {
    'use server';
    
    const companyName = formData.get('companyName') as string;
    const logo = formData.get('logo') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const website = formData.get('website') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    const brandingData = {
      userId: currentUser.id,
      companyName: companyName || null,
      logo: logo || null,
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#64748b',
      website: website || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
    };

    if (currentBranding) {
      await db
        .update(branding)
        .set({ ...brandingData, updatedAt: new Date() })
        .where(eq(branding.id, currentBranding.id));
    } else {
      await db.insert(branding).values(brandingData);
    }

    revalidatePath('/branding');
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agency Branding</h1>
          <p className="text-gray-600">Customize your brand identity for client-facing materials</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateBranding} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Name
                  </Label>
                  <Input 
                    id="companyName" 
                    name="companyName" 
                    placeholder="Your Agency Name" 
                    defaultValue={currentBranding?.companyName || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input 
                    id="website" 
                    name="website" 
                    placeholder="https://youragency.com" 
                    defaultValue={currentBranding?.website || ''}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="logo">Logo URL</Label>
                <Input 
                  id="logo" 
                  name="logo" 
                  placeholder="https://youragency.com/logo.png" 
                  defaultValue={currentBranding?.logo || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="primaryColor" 
                      name="primaryColor" 
                      type="color" 
                      className="w-16 h-10 p-1" 
                      defaultValue={currentBranding?.primaryColor || '#3b82f6'}
                    />
                    <Input 
                      placeholder="#3b82f6" 
                      className="flex-1" 
                      defaultValue={currentBranding?.primaryColor || '#3b82f6'}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="secondaryColor" 
                      name="secondaryColor" 
                      type="color" 
                      className="w-16 h-10 p-1" 
                      defaultValue={currentBranding?.secondaryColor || '#64748b'}
                    />
                    <Input 
                      placeholder="#64748b" 
                      className="flex-1" 
                      defaultValue={currentBranding?.secondaryColor || '#64748b'}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Business Address
                </Label>
                <textarea 
                  id="address" 
                  name="address" 
                  rows={3}
                  placeholder="123 Business St\nSuite 100\nCity, State 12345" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  defaultValue={currentBranding?.address || ''}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="(555) 123-4567" 
                    defaultValue={currentBranding?.phone || ''}
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Email
                  </Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="contact@youragency.com" 
                    defaultValue={currentBranding?.email || ''}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Palette className="h-4 w-4 mr-2" />
                {currentBranding ? 'Update' : 'Save'} Brand Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentBranding && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-6 border rounded-lg" style={{ backgroundColor: `${currentBranding.primaryColor}10` }}>
                  {currentBranding.logo && (
                    <img src={currentBranding.logo} alt="Logo" className="h-12 w-auto" />
                  )}
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: currentBranding.primaryColor }}>
                      {currentBranding.companyName || 'Your Agency'}
                    </h3>
                    {currentBranding.website && (
                      <p className="text-sm" style={{ color: currentBranding.secondaryColor }}>
                        {currentBranding.website}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Colors:</strong>
                    <div className="flex gap-2 mt-1">
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: currentBranding.primaryColor }}
                        title={`Primary: ${currentBranding.primaryColor}`}
                      />
                      <div 
                        className="w-6 h-6 rounded border" 
                        style={{ backgroundColor: currentBranding.secondaryColor }}
                        title={`Secondary: ${currentBranding.secondaryColor}`}
                      />
                    </div>
                  </div>
                  <div>
                    <strong>Contact:</strong>
                    <div className="mt-1 space-y-1">
                      {currentBranding.phone && <div>{currentBranding.phone}</div>}
                      {currentBranding.email && <div>{currentBranding.email}</div>}
                    </div>
                  </div>
                </div>
                
                {currentBranding.address && (
                  <div>
                    <strong>Address:</strong>
                    <div className="mt-1 whitespace-pre-line text-sm">
                      {currentBranding.address}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}