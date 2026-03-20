import { db } from '@/lib/db/drizzle';
import { clients } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Mail, Phone, User, MapPin } from 'lucide-react';

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
    const address = formData.get('address') as string;
    const notes = formData.get('notes') as string;

    if (!name || !email) {
      return;
    }

    await db.insert(clients).values({
      userId: currentUser.id,
      name,
      email,
      phone: phone || '',
      company: company || '',
      address: address || '',
      notes: notes || ''
    });

    revalidatePath('/clients');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-gray-600">Manage your client contacts and company details</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createClient} className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="name">Client Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Enter company name"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Enter client address"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  placeholder="Enter any notes about this client"
                />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full md:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client List</CardTitle>
          </CardHeader>
          <CardContent>
            {clientList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  No clients yet
                </h3>
                <p className="text-gray-600">
                  Add your first client to get started with managing your business relationships.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientList.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium">{client.name ?? 'Unknown'}</div>
                              {client.notes && (
                                <div className="text-sm text-gray-500">
                                  {(client.notes ?? '').substring(0, 50)}{(client.notes ?? '').length > 50 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              <span>{client.company}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{client.email ?? 'No email'}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">{client.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">
                                {(client.address ?? '').substring(0, 50)}{(client.address ?? '').length > 50 ? '...' : ''}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {client.createdAt ? new Intl.DateTimeFormat('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }).format(new Date(client.createdAt)) : 'Unknown'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}