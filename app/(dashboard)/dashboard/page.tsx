import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, activityLogs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, and, sum } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  FileText, 
  Receipt, 
  Plus,
  Activity,
  DollarSign
} from 'lucide-react';

async function getStats(userId: number) {
  const [clientsCount, projectsCount, proposalsCount, invoicesCount, totalRevenue] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.userId, userId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, userId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(proposals)
      .where(eq(proposals.userId, userId)),
    
    db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.userId, userId)),
    
    db.select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(eq(invoices.userId, userId), eq(invoices.status, 'paid')))
  ]);

  return {
    clients: clientsCount[0]?.count || 0,
    projects: projectsCount[0]?.count || 0,
    proposals: proposalsCount[0]?.count || 0,
    invoices: invoicesCount[0]?.count || 0,
    revenue: Number(totalRevenue[0]?.total || 0)
  };
}

async function getRecentActivity(userId: number) {
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      createdAt: projects.createdAt,
      type: sql<string>`'project'`
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt))
    .limit(3);

  const recentProposals = await db
    .select({
      id: proposals.id,
      name: proposals.title,
      status: proposals.status,
      createdAt: proposals.createdAt,
      type: sql<string>`'proposal'`
    })
    .from(proposals)
    .where(eq(proposals.userId, userId))
    .orderBy(desc(proposals.createdAt))
    .limit(3);

  const recentInvoices = await db
    .select({
      id: invoices.id,
      name: invoices.title,
      status: invoices.status,
      createdAt: invoices.createdAt,
      type: sql<string>`'invoice'`
    })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt))
    .limit(3);

  const allActivity = [
    ...recentProjects,
    ...recentProposals,
    ...recentInvoices
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 5);

  return allActivity;
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const stats = await getStats(currentUser.id);
  const recentActivity = await getRecentActivity(currentUser.id);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ClientDesk Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • {item.status}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/clients" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </Link>
            <Link href="/projects" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
            <Link href="/proposals" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
            </Link>
            <Link href="/invoices" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            </Link>
            <Link href="/branding" className="w-full">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Setup Branding
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}