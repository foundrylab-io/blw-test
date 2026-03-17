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
import { Plus, User, Building, Mail, Phone, Globe } from 'lucide-react';

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
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your client contacts and information</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {clientList.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Client Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientList.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            {client.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.company && (
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-500" />
                              {client.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              {client.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {client.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(client.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by adding your first client to manage their projects and invoices.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createClient} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" name="name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" name="website" type="url" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Client
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}