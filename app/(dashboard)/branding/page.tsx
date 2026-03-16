import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Globe, Mail, Phone, MapPin } from 'lucide-react';

export default async function BrandingPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Get existing branding settings
  const existingBranding = await db
    .select()
    .from(agencyBranding)
    .where(eq(agencyBranding.userId, currentUser.id))
    .limit(1);

  const branding = existingBranding[0] || null;

  async function saveBranding(formData: FormData) {
    'use server';
    
    const agencyName = formData.get('agencyName') as string || null;
    const primaryColor = formData.get('primaryColor') as string || null;
    const logoUrl = formData.get('logoUrl') as string || null;
    const website = formData.get('website') as string || null;
    const address = formData.get('address') as string || null;
    const phone = formData.get('phone') as string || null;
    const email = formData.get('email') as string || null;
    
    const brandingData = {
      userId: currentUser.id,
      agencyName,
      primaryColor,
      logoUrl,
      website,
      address,
      phone,
      email,
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
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agency Branding</h1>
          <p className="text-gray-600 mt-1">Customize your agency's brand settings and contact information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Identity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={saveBranding} className="space-y-4">
                <div>
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    type="text"
                    id="agencyName"
                    name="agencyName"
                    placeholder="Your Agency Name"
                    defaultValue={branding?.agencyName || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      id="primaryColor"
                      name="primaryColor"
                      className="w-16 h-10"
                      defaultValue={branding?.primaryColor || '#3b82f6'}
                    />
                    <Input
                      type="text"
                      placeholder="#3b82f6"
                      defaultValue={branding?.primaryColor || ''}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    type="url"
                    id="logoUrl"
                    name="logoUrl"
                    placeholder="https://example.com/logo.png"
                    defaultValue={branding?.logoUrl || ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your logo to a cloud service and paste the URL here
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    type="url"
                    id="website"
                    name="website"
                    placeholder="https://youragency.com"
                    defaultValue={branding?.website || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="contact@youragency.com"
                    defaultValue={branding?.email || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    defaultValue={branding?.phone || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Business St&#10;Suite 100&#10;City, State 12345"
                    defaultValue={branding?.address || ''}
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Save Branding Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <p className="text-sm text-gray-600">
                This is how your branding will appear on proposals and invoices
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                {/* Logo */}
                {branding?.logoUrl ? (
                  <div className="mb-4">
                    <img 
                      src={branding.logoUrl} 
                      alt="Logo" 
                      className="h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="mb-4 h-12 w-32 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                    Your Logo
                  </div>
                )}
                
                {/* Agency Name */}
                <h2 
                  className="text-xl font-bold mb-2"
                  style={{ color: branding?.primaryColor || '#3b82f6' }}
                >
                  {branding?.agencyName || 'Your Agency Name'}
                </h2>
                
                {/* Contact Info */}
                <div className="space-y-2 text-sm text-gray-600">
                  {branding?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>{branding.website}</span>
                    </div>
                  )}
                  
                  {branding?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{branding.email}</span>
                    </div>
                  )}
                  
                  {branding?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{branding.phone}</span>
                    </div>
                  )}
                  
                  {branding?.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span className="whitespace-pre-line">{branding.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {branding && (
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Proposals</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Invoices</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span>Client Portal</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}