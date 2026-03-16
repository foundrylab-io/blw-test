import { redirect } from 'next/navigation';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, files, activityLogs, users } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, count, sum } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FolderOpen, FileText, Receipt, Plus, Activity, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');

  // Fetch dashboard stats
  const [
    clientCount,
    projectCount,
    proposalCount,
    invoiceCount,
    totalRevenue,
    recentActivity,
    recentProjects
  ] = await Promise.all([
    db.select({ count: count() }).from(clients).where(eq(clients.userId, user.id)),
    db.select({ count: count() }).from(projects).where(eq(projects.userId, user.id)),
    db.select({ count: count() }).from(proposals).where(eq(proposals.userId, user.id)),
    db.select({ count: count() }).from(invoices).where(eq(invoices.userId, user.id)),
    db.select({ total: sum(invoices.totalAmount) }).from(invoices).where(eq(invoices.userId, user.id)),
    db.select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      userName: users.name
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(5),
    db.select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      createdAt: projects.createdAt,
      clientName: clients.name
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, user.id))
    .orderBy(desc(projects.createdAt))
    .limit(5)
  ]);

  const stats = {
    clients: clientCount[0]?.count || 0,
    projects: projectCount[0]?.count || 0,
    proposals: proposalCount[0]?.count || 0,
    invoices: invoiceCount[0]?.count || 0,
    revenue: totalRevenue[0]?.total || '0'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome to ClientDesk</h1>
          <p className="text-muted-foreground">Manage your clients, projects, and business efficiently</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/clients">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
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
            <div className="text-2xl font-bold">${stats.revenue}</div>
            <p className="text-xs text-muted-foreground">From all invoices</p>
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
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium">{activity.userName || 'System'}</span>
                      <span className="text-muted-foreground"> {activity.action.toLowerCase().replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                        {project.name}
                      </Link>
                      <div className="text-sm text-muted-foreground">
                        {project.clientName} • {project.status}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/projects">View All Projects</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
                <Button asChild className="mt-4">
                  <Link href="/projects">Create Your First Project</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/clients">
                <Users className="w-6 h-6 mb-2" />
                Manage Clients
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/proposals">
                <FileText className="w-6 h-6 mb-2" />
                Create Proposal
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/invoices">
                <Receipt className="w-6 h-6 mb-2" />
                Generate Invoice
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-20 flex-col">
              <Link href="/files">
                <FolderOpen className="w-6 h-6 mb-2" />
                Upload Files
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}