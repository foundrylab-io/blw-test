import { db } from '@/lib/db/drizzle';
import { clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Mail, Phone, Building, Globe, MapPin } from 'lucide-react';

export default async function ClientsPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const clientList = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, currentUser.id))
    .orderBy(desc(clients.createdAt));

  async function createClient(formData: FormData) {
    'use server';
    
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const company = formData.get('company') as string;
    const website = formData.get('website') as string;
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;
    
    if (!name) return;
    
    await db.insert(clients).values({
      userId: currentUser.id,
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      website: website || null,
      address: address || null,
      notes: notes || null,
    });
    
    revalidatePath('/clients');
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {clientList.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first client</p>
            <form action={createClient} className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" name="name" placeholder="Enter client name" required />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="client@example.com" />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" placeholder="Company name" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" placeholder="Phone number" />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" placeholder="https://example.com" />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="Full address" />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" placeholder="Additional notes" />
              </div>
              <Button type="submit" className="w-full">
                Add Client
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createClient} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Client Name *</Label>
                  <Input id="name" name="name" placeholder="Enter client name" required />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="client@example.com" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" placeholder="Company name" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" placeholder="Phone number" />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" placeholder="https://example.com" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" placeholder="Full address" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input id="notes" name="notes" placeholder="Additional notes" />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Client
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Clients ({clientList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientList.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="font-medium">{client.name}</div>
                        {client.notes && (
                          <div className="text-sm text-gray-500 mt-1">{client.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.company ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-gray-400" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {client.phone}
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              {client.address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.website ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <a 
                              href={client.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {client.website}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(new Date(client.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}