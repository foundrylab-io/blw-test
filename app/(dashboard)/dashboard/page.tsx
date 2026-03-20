import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { 
  clients, 
  projects, 
  proposals, 
  invoices, 
  files,
  activityLogs 
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, count, sum } from 'drizzle-orm';
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
  AlertCircle
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch dashboard stats
  const [
    clientsCount,
    projectsCount,
    proposalsCount,
    invoicesCount,
    totalRevenue,
    recentActivity
  ] = await Promise.all([
    // Clients count
    db.select({ count: count() })
      .from(clients)
      .where(eq(clients.userId, currentUser.id)),
    
    // Projects count
    db.select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, currentUser.id)),
    
    // Proposals count
    db.select({ count: count() })
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id)),
    
    // Invoices count
    db.select({ count: count() })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id)),
    
    // Total revenue from paid invoices
    db.select({ total: sum(invoices.total) })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id)),
    
    // Recent activity logs
    db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.timestamp))
      .limit(5)
  ]);

  // Recent projects with client info
  const recentProjects = await db.select({
    id: projects.id,
    name: projects.name,
    status: projects.status,
    createdAt: projects.createdAt,
    clientName: clients.name
  })
  .from(projects)
  .leftJoin(clients, eq(projects.clientId, clients.id))
  .where(eq(projects.userId, currentUser.id))
  .orderBy(desc(projects.createdAt))
  .limit(5);

  // Recent proposals with client info
  const recentProposals = await db.select({
    id: proposals.id,
    title: proposals.title,
    status: proposals.status,
    total: proposals.total,
    createdAt: proposals.createdAt,
    clientName: clients.name
  })
  .from(proposals)
  .leftJoin(clients, eq(proposals.clientId, clients.id))
  .where(eq(proposals.userId, currentUser.id))
  .orderBy(desc(proposals.createdAt))
  .limit(3);

  const stats = {
    clients: clientsCount[0]?.count || 0,
    projects: projectsCount[0]?.count || 0,
    proposals: proposalsCount[0]?.count || 0,
    invoices: invoicesCount[0]?.count || 0,
    revenue: totalRevenue[0]?.total || '0'
  };

  const formatCurrency = (amount: string | null) => {
    const num = parseFloat(amount || '0');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'accepted':
      case 'paid':
        return 'text-green-600';
      case 'in_progress':
      case 'sent':
        return 'text-blue-600';
      case 'draft':
        return 'text-gray-600';
      case 'rejected':
      case 'overdue':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome to ClientDesk</h1>
          <p className="text-muted-foreground">
            Manage your clients, projects, and proposals all in one place.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
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
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals</CardTitle>
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
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto flex-col gap-2 py-4">
              <Link href="/clients">
                <Users className="h-6 w-6" />
                <span>Add Client</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/projects">
                <Briefcase className="h-6 w-6" />
                <span>New Project</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/proposals">
                <FileText className="h-6 w-6" />
                <span>Create Proposal</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
              <Link href="/invoices">
                <Receipt className="h-6 w-6" />
                <span>Generate Invoice</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No projects yet. Create your first project to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{project.name ?? 'Untitled Project'}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.clientName ?? 'Unknown Client'} • {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(project.status)}`}>
                      {(project.status ?? 'draft').charAt(0).toUpperCase() + (project.status ?? 'draft').slice(1)}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/projects">View All Projects</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentProposals.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No proposals yet. Create your first proposal to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{proposal.title ?? 'Untitled Proposal'}</p>
                      <p className="text-sm text-muted-foreground">
                        {proposal.clientName ?? 'Unknown Client'} • {formatCurrency(proposal.total ?? '0')}
                      </p>
                    </div>
                    <div className={`text-sm font-medium ${getStatusColor(proposal.status)}`}>
                      {(proposal.status ?? 'draft').charAt(0).toUpperCase() + (proposal.status ?? 'draft').slice(1)}
                    </div>
                  </div>
                ))}
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/proposals">View All Proposals</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}