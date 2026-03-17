import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, activityLogs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, and } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  FolderOpen, 
  FileText, 
  Receipt, 
  Plus,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch dashboard stats
  const [
    clientCount,
    projectCount, 
    proposalCount,
    invoiceCount,
    totalRevenue,
    recentActivity
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db.select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(eq(projects.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db.select({ count: sql<number>`count(*)` })
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db.select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db.select({ total: sql<string>`COALESCE(SUM(total_amount), 0)` })
      .from(invoices)
      .where(and(
        eq(invoices.userId, currentUser.id),
        eq(invoices.status, 'paid')
      ))
      .then(result => parseFloat(result[0]?.total ?? '0')),
    
    db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, currentUser.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(5)
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatAction = (action: string) => {
    return action.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome to ClientDesk</h1>
          <p className="text-muted-foreground">Manage your clients, projects, and proposals all in one place</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientCount}</div>
            <p className="text-xs text-muted-foreground">Active client relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting client response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{formatAction(activity.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/clients">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Add Client</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/projects">
                  <FolderOpen className="h-5 w-5" />
                  <span className="text-sm">New Project</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/proposals">
                  <FileText className="h-5 w-5" />
                  <span className="text-sm">Create Proposal</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-auto flex-col gap-2 p-4">
                <Link href="/invoices">
                  <Receipt className="h-5 w-5" />
                  <span className="text-sm">Send Invoice</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/files">
                <Plus className="h-4 w-4 mr-2" />
                Upload Files
              </Link>
            </Button>
            
            <Button asChild variant="outline">
              <Link href="/branding">
                <Plus className="h-4 w-4 mr-2" />
                Customize Branding
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}