import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, activityLogs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, and } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FolderOpen, FileText, Receipt, Plus, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch dashboard stats
  const [clientsCount, projectsCount, proposalsCount, invoicesStats, recentActivity] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.userId, currentUser.id)),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.userId, currentUser.id)),
    db.select({ count: sql<number>`count(*)` }).from(proposals).where(eq(proposals.userId, currentUser.id)),
    db.select({
      totalInvoices: sql<number>`count(*)`,
      totalRevenue: sql<string>`coalesce(sum(total_amount), 0)`,
      paidRevenue: sql<string>`coalesce(sum(paid_amount), 0)`
    }).from(invoices).where(eq(invoices.userId, currentUser.id)),
    db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp
    })
    .from(activityLogs)
    .orderBy(desc(activityLogs.timestamp))
    .limit(5)
  ]);

  const stats = {
    clients: clientsCount[0]?.count || 0,
    projects: projectsCount[0]?.count || 0,
    proposals: proposalsCount[0]?.count || 0,
    invoices: invoicesStats[0]?.totalInvoices || 0,
    totalRevenue: parseFloat(invoicesStats[0]?.totalRevenue || '0'),
    paidRevenue: parseFloat(invoicesStats[0]?.paidRevenue || '0')
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to ClientDesk</h1>
          <p className="text-muted-foreground">Manage your clients, projects, and business operations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposals}</div>
            <p className="text-xs text-muted-foreground">Total proposals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.paidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalRevenue.toLocaleString()} total invoiced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.action.toLowerCase().replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                        {new Date(activity.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/clients">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Users className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Manage Clients</div>
                    <div className="text-xs text-muted-foreground">View all clients</div>
                  </div>
                </Button>
              </Link>

              <Link href="/projects">
                <Button variant="outline" className="w-full justify-start h-12">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Projects</div>
                    <div className="text-xs text-muted-foreground">Track progress</div>
                  </div>
                </Button>
              </Link>

              <Link href="/proposals">
                <Button variant="outline" className="w-full justify-start h-12">
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Proposals</div>
                    <div className="text-xs text-muted-foreground">Create & send</div>
                  </div>
                </Button>
              </Link>

              <Link href="/invoices">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Receipt className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Invoices</div>
                    <div className="text-xs text-muted-foreground">Generate bills</div>
                  </div>
                </Button>
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Link href="/clients">
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Client
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}