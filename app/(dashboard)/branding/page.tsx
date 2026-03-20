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
import { Palette, Building2, Globe, Phone, Mail, MapPin, Save } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const existingBranding = await db
    .select()
    .from(branding)
    .where(eq(branding.userId, currentUser.id))
    .limit(1);

  const brandingData = existingBranding[0] || null;

  async function saveBranding(formData: FormData) {
    'use server';
    
    const companyName = formData.get('companyName') as string;
    const primaryColor = formData.get('primaryColor') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const website = formData.get('website') as string;
    const address = formData.get('address') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;

    if (!companyName || !primaryColor) {
      return;
    }

    const brandingValues = {
      userId: currentUser.id,
      companyName,
      primaryColor,
      logoUrl: logoUrl || null,
      website: website || null,
      address: address || null,
      phone: phone || null,
      email: email || null,
      updatedAt: new Date(),
    };

    if (brandingData) {
      await db
        .update(branding)
        .set(brandingValues)
        .where(eq(branding.id, brandingData.id));
    } else {
      await db.insert(branding).values({
        ...brandingValues,
        createdAt: new Date(),
      });
    }

    revalidatePath('/branding');
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agency Branding</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Brand Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={saveBranding} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Your Agency Name"
                  defaultValue={brandingData?.companyName ?? ''}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primaryColor"
                    name="primaryColor"
                    defaultValue={brandingData?.primaryColor ?? '#000000'}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    required
                  />
                  <Input
                    placeholder="#000000"
                    defaultValue={brandingData?.primaryColor ?? '#000000'}
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
                  placeholder="https://example.com/logo.png"
                  defaultValue={brandingData?.logoUrl ?? ''}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <Globe className="w-4 h-4" />
                  </span>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    defaultValue={brandingData?.website ?? ''}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Contact Email</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <Mail className="w-4 h-4" />
                  </span>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="hello@yourcompany.com"
                    defaultValue={brandingData?.email ?? ''}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <Phone className="w-4 h-4" />
                  </span>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    defaultValue={brandingData?.phone ?? ''}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    placeholder="123 Business St, Suite 100, City, State 12345"
                    defaultValue={brandingData?.address ?? ''}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Branding Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Brand Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div
                className="p-6 border-2 border-dashed border-gray-200 rounded-lg"
                style={{ borderColor: brandingData?.primaryColor ?? undefined }}
              >
                <div className="text-center">
                  {brandingData?.logoUrl ? (
                    <img
                      src={brandingData.logoUrl}
                      alt="Company Logo"
                      className="h-16 mx-auto mb-4 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <h3
                    className="text-xl font-bold mb-2"
                    style={{ color: brandingData?.primaryColor ?? undefined }}
                  >
                    {brandingData?.companyName ?? 'Your Company Name'}
                  </h3>
                  {brandingData?.website && (
                    <p className="text-sm text-gray-600 mb-2">
                      {brandingData.website}
                    </p>
                  )}
                  {brandingData?.email && (
                    <p className="text-sm text-gray-600 mb-1">
                      {brandingData.email}
                    </p>
                  )}
                  {brandingData?.phone && (
                    <p className="text-sm text-gray-600 mb-2">
                      {brandingData.phone}
                    </p>
                  )}
                  {brandingData?.address && (
                    <p className="text-xs text-gray-500 whitespace-pre-line">
                      {brandingData.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">How this appears:</h4>
                <ul className="space-y-1 text-xs">
                  <li>• Client proposals and invoices</li>
                  <li>• Email communications</li>
                  <li>• Project documents</li>
                  <li>• Public client portals</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Brand Color</h4>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded border border-gray-200"
                    style={{ backgroundColor: brandingData?.primaryColor ?? '#000000' }}
                  />
                  <span className="text-sm font-mono">
                    {brandingData?.primaryColor ?? '#000000'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}