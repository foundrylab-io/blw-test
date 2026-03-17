import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Building2, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Get existing branding data
  const brandingData = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .limit(1);

  const branding = brandingData[0] || null;

  async function updateBranding(formData: FormData) {
    'use server';

    const agencyName = formData.get('agencyName') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const secondaryColor = formData.get('secondaryColor') as string;
    const website = formData.get('website') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    if (!agencyName) {
      return;
    }

    const brandingValues = {
      userId: currentUser.id,
      agencyName,
      logoUrl: logoUrl || '',
      primaryColor: primaryColor || '#3b82f6',
      secondaryColor: secondaryColor || '#64748b',
      website: website || '',
      address: address || '',
      phone: phone || '',
      email: email || '',
      updatedAt: new Date(),
    };

    if (branding) {
      // Update existing branding
      await db
        .update(agencyBranding)
        .set(brandingValues)
        .where(eq(agencyBranding.id, branding.id));
    } else {
      // Create new branding
      await db.insert(agencyBranding).values(brandingValues);
    }

    revalidatePath('/branding');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Agency Branding</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Branding Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateBranding} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency Name *</Label>
                <Input
                  id="agencyName"
                  name="agencyName"
                  required
                  defaultValue={branding?.agencyName ?? ''}
                  placeholder="Your Agency Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  defaultValue={branding?.logoUrl ?? ''}
                  placeholder="https://example.com/logo.png"
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
                      defaultValue={branding?.primaryColor ?? '#3b82f6'}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      defaultValue={branding?.primaryColor ?? '#3b82f6'}
                      className="flex-1"
                      placeholder="#3b82f6"
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
                      defaultValue={branding?.secondaryColor ?? '#64748b'}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      type="text"
                      defaultValue={branding?.secondaryColor ?? '#64748b'}
                      className="flex-1"
                      placeholder="#64748b"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={branding?.website ?? ''}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={branding?.email ?? ''}
                  placeholder="hello@youragency.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={branding?.phone ?? ''}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  defaultValue={branding?.address ?? ''}
                  placeholder="123 Business St, Suite 100\nCity, State 12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full">
                {branding ? 'Update Branding' : 'Save Branding'}
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
              <div
                className="p-6 rounded-lg border-2 border-dashed border-gray-200"
                style={{
                  backgroundColor: branding?.primaryColor ? `${branding.primaryColor}10` : undefined,
                  borderColor: branding?.primaryColor ?? undefined,
                }}
              >
                <div className="text-center space-y-3">
                  {(branding?.logoUrl ?? '') !== '' && (
                    <img
                      src={branding?.logoUrl ?? ''}
                      alt="Agency Logo"
                      className="h-12 mx-auto object-contain"
                    />
                  )}
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: branding?.primaryColor ?? undefined }}
                  >
                    {(branding?.agencyName ?? '') || 'Your Agency Name'}
                  </h2>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>{(branding?.website ?? '') || 'Website not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{(branding?.email ?? '') || 'Email not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{(branding?.phone ?? '') || 'Phone not set'}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-4 w-4 mt-0.5" />
                  <span>{(branding?.address ?? '') || 'Address not set'}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  This is how your branding will appear on proposals, invoices, and client communications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {branding && (
        <Card>
          <CardHeader>
            <CardTitle>Current Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Agency Name:</strong> {branding.agencyName}
              </div>
              <div>
                <strong>Primary Color:</strong>
                <span className="ml-2 inline-flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: branding.primaryColor ?? undefined }}
                  ></div>
                  {branding.primaryColor}
                </span>
              </div>
              <div>
                <strong>Secondary Color:</strong>
                <span className="ml-2 inline-flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: branding.secondaryColor ?? undefined }}
                  ></div>
                  {branding.secondaryColor}
                </span>
              </div>
              <div>
                <strong>Last Updated:</strong>{' '}
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }).format(new Date(branding.updatedAt))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}