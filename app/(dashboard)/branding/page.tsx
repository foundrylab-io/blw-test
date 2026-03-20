import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building2, Globe, Phone, Mail, MapPin, Save } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const branding = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .limit(1);

  const currentBranding = branding[0] || null;

  async function saveBranding(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const websiteUrl = formData.get('websiteUrl') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    
    if (!agencyName) return;
    
    const brandingData = {
      userId: currentUser.id,
      agencyName,
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#6b7280',
      logoUrl: logoUrl || '',
      websiteUrl: websiteUrl || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
    };
    
    if (currentBranding) {
      await db
        .update(agencyBranding)
        .set({ ...brandingData, updatedAt: new Date() })
        .where(eq(agencyBranding.id, currentBranding.id));
    } else {
      await db.insert(agencyBranding).values(brandingData);
    }
    
    revalidatePath('/branding');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agency Branding</h1>
          <p className="text-muted-foreground mt-1">
            Customize your agency's brand identity and contact information
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveBranding} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agencyName">Agency Name *</Label>
                  <Input
                    id="agencyName"
                    name="agencyName"
                    type="text"
                    placeholder="Your Agency Name"
                    defaultValue={currentBranding?.agencyName ?? ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="contact@agency.com"
                    defaultValue={currentBranding?.email ?? ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      defaultValue={currentBranding?.primaryColor ?? '#3b82f6'}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      placeholder="#3b82f6"
                      defaultValue={currentBranding?.primaryColor ?? '#3b82f6'}
                      className="flex-1"
                      readOnly
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
                      defaultValue={currentBranding?.secondaryColor ?? '#6b7280'}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      placeholder="#6b7280"
                      defaultValue={currentBranding?.secondaryColor ?? '#6b7280'}
                      className="flex-1"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    defaultValue={currentBranding?.logoUrl ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://youragency.com"
                    defaultValue={currentBranding?.websiteUrl ?? ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    defaultValue={currentBranding?.phone ?? ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder="123 Business St, City, State 12345"
                    defaultValue={currentBranding?.address ?? ''}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Brand Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {currentBranding && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Brand Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div 
                  className="rounded-lg p-6 text-white"
                  style={{ backgroundColor: currentBranding.primaryColor ?? '#3b82f6' }}
                >
                  <h2 className="text-2xl font-bold mb-2">{currentBranding.agencyName}</h2>
                  <div className="space-y-2 text-sm opacity-90">
                    {currentBranding.websiteUrl && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {currentBranding.websiteUrl}
                      </div>
                    )}
                    {currentBranding.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {currentBranding.email}
                      </div>
                    )}
                    {currentBranding.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {currentBranding.phone}
                      </div>
                    )}
                    {currentBranding.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {currentBranding.address}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>This is how your brand will appear on proposals, invoices, and other client-facing documents.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}