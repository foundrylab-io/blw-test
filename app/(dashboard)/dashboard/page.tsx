import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, activityLogs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, and, count } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Plus, 
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Get stats
  const [
    clientsCount,
    projectsCount, 
    proposalsCount,
    invoicesCount,
    totalRevenue,
    pendingInvoices,
    activeProjects,
    recentActivity
  ] = await Promise.all([
    db.select({ count: count() }).from(clients).where(eq(clients.userId, currentUser.id)),
    db.select({ count: count() }).from(projects).where(eq(projects.userId, currentUser.id)),
    db.select({ count: count() }).from(proposals).where(eq(proposals.userId, currentUser.id)),
    db.select({ count: count() }).from(invoices).where(eq(invoices.userId, currentUser.id)),
    db.select({ 
      total: sql<string>`COALESCE(SUM(${invoices.totalAmount}), 0)`
    }).from(invoices).where(and(
      eq(invoices.userId, currentUser.id),
      eq(invoices.status, 'paid')
    )),
    db.select({ count: count() }).from(invoices).where(and(
      eq(invoices.userId, currentUser.id),
      eq(invoices.status, 'sent')
    )),
    db.select({ count: count() }).from(projects).where(and(
      eq(projects.userId, currentUser.id),
      eq(projects.status, 'active')
    )),
    db.select().from(activityLogs).where(eq(activityLogs.userId, currentUser.id))
      .orderBy(desc(activityLogs.timestamp)).limit(5)
  ]);

  const stats = {
    clients: clientsCount[0]?.count ?? 0,
    projects: projectsCount[0]?.count ?? 0,
    proposals: proposalsCount[0]?.count ?? 0,
    invoices: invoicesCount[0]?.count ?? 0,
    revenue: parseFloat(totalRevenue[0]?.total ?? '0'),
    pendingInvoices: pendingInvoices[0]?.count ?? 0,
    activeProjects: activeProjects[0]?.count ?? 0
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to ClientDesk</h1>
        <p className="text-gray-600 mt-2">Manage your clients, projects, and proposals all in one place</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients}</div>
            <p className="text-xs text-muted-foreground">Active client relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposals}</div>
            <p className="text-xs text-muted-foreground">Total proposals created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/clients">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Clients
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="mr-2 h-4 w-4" />
                  View Projects
                </Button>
              </Link>
              <Link href="/proposals">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Create Proposal
                </Button>
              </Link>
              <Link href="/invoices">
                <Button variant="outline" className="w-full justify-start">
                  <Receipt className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Button>
              </Link>
            </div>
            <div className="pt-4 border-t">
              <Link href="/branding">
                <Button variant="default" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Setup Agency Branding
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-8 w-8 mb-2" />
                <p>No recent activity</p>
                <p className="text-sm">Start by adding your first client</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {activity.action.includes('SIGN') && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {activity.action.includes('CREATE') && <Plus className="h-4 w-4 text-blue-500" />}
                      {activity.action.includes('UPDATE') && <TrendingUp className="h-4 w-4 text-orange-500" />}
                      {!activity.action.includes('SIGN') && !activity.action.includes('CREATE') && !activity.action.includes('UPDATE') && 
                        <Clock className="h-4 w-4 text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
            <p className="text-xs text-muted-foreground">All time projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invoices}</div>
            <p className="text-xs text-muted-foreground">Invoices generated</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}