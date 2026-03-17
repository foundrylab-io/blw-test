import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, files, activityLogs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, count, sum } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  FolderOpen,
  FileText,
  Receipt,
  Plus,
  Activity,
  DollarSign,
  TrendingUp
} from 'lucide-react';

async function getDashboardStats(userId: number) {
  const [
    clientsCount,
    projectsCount,
    proposalsCount,
    invoicesCount,
    totalRevenue,
    recentActivity
  ] = await Promise.all([
    db.select({ count: count() })
      .from(clients)
      .where(eq(clients.userId, userId)),
    
    db.select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, userId)),
    
    db.select({ count: count() })
      .from(proposals)
      .where(eq(proposals.userId, userId)),
    
    db.select({ count: count() })
      .from(invoices)
      .where(eq(invoices.userId, userId)),
    
    db.select({ total: sum(invoices.paidAmount) })
      .from(invoices)
      .where(eq(invoices.userId, userId)),
    
    db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.timestamp))
    .limit(5)
  ]);

  return {
    clientsCount: clientsCount[0]?.count ?? 0,
    projectsCount: projectsCount[0]?.count ?? 0,
    proposalsCount: proposalsCount[0]?.count ?? 0,
    invoicesCount: invoicesCount[0]?.count ?? 0,
    totalRevenue: Number(totalRevenue[0]?.total ?? 0),
    recentActivity
  };
}

async function getRecentProjects(userId: number) {
  return db.select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
    createdAt: projects.createdAt,
    clientName: clients.name
  })
  .from(projects)
  .innerJoin(clients, eq(projects.clientId, clients.id))
  .where(eq(projects.userId, userId))
  .orderBy(desc(projects.createdAt))
  .limit(5);
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(currentUser.id),
    getRecentProjects(currentUser.id)
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatActivityAction = (action: string) => {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ClientDesk</h1>
        <p className="text-muted-foreground">
          Manage your clients, projects, and proposals all in one place.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientsCount}</div>
            <p className="text-xs text-muted-foreground">Active client relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsCount}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.proposalsCount}</div>
            <p className="text-xs text-muted-foreground">Total proposals created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From paid invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-8">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              ) : (
                recentProjects.map((project) => (
                  <div key={project.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{project.name ?? 'Untitled Project'}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.clientName ?? 'No Client'} • {(project.status ?? 'Unknown').charAt(0).toUpperCase() + (project.status ?? 'Unknown').slice(1)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentProjects.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Link href="/projects">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Projects
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{formatActivityAction(activity.action ?? 'Unknown Action')}</p>
                      <p className="text-sm text-muted-foreground">System activity</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/clients">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span>Add Client</span>
              </Button>
            </Link>
            <Link href="/projects">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                <FolderOpen className="h-6 w-6" />
                <span>New Project</span>
              </Button>
            </Link>
            <Link href="/proposals">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                <span>Create Proposal</span>
              </Button>
            </Link>
            <Link href="/invoices">
              <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                <Receipt className="h-6 w-6" />
                <span>Generate Invoice</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}