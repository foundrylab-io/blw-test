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
import { Plus, User, Building } from 'lucide-react';

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

    if (!name.trim()) return;

    await db.insert(clients).values({
      userId: currentUser.id,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      company: company.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    });

    revalidatePath('/clients');
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clients</h1>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Client Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {clientList.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No clients yet</p>
                <p className="text-sm">Add your first client to get started</p>
              </div>
            ) : (
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
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        {client.company ? (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{client.email || '-'}</TableCell>
                      <TableCell>{client.phone || '-'}</TableCell>
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
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Client</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createClient} className="space-y-4">
              <div>
                <Label htmlFor="name">Client Name *</Label>
                <Input id="name" name="name" required className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" className="mt-1" />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" className="mt-1" />
              </div>
              
              <Button type="submit" className="w-full">
                Add Client
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}