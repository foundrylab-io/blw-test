import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Clock 
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch stats
  const [clientsCount, projectsCount, proposalsCount, invoicesCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.userId, currentUser.id)),
    db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.userId, currentUser.id)),
    db.select({ count: sql<number>`count(*)` }).from(proposals).where(eq(proposals.userId, currentUser.id)),
    db.select({ count: sql<number>`count(*)` }).from(invoices).where(eq(invoices.userId, currentUser.id))
  ]);

  // Fetch total revenue from paid invoices
  const revenueResult = await db
    .select({ 
      total: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)` 
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id));

  const totalRevenue = parseFloat(revenueResult[0]?.total ?? '0');

  // Fetch recent projects
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      createdAt: projects.createdAt,
      clientName: clients.companyName
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  // Fetch recent proposals
  const recentProposals = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      createdAt: proposals.createdAt,
      totalAmount: proposals.totalAmount
    })
    .from(proposals)
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt))
    .limit(3);

  const stats = [
    {
      title: 'Total Clients',
      value: clientsCount[0]?.count ?? 0,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Active Projects',
      value: projectsCount[0]?.count ?? 0,
      icon: Briefcase,
      color: 'text-green-600'
    },
    {
      title: 'Proposals Sent',
      value: proposalsCount[0]?.count ?? 0,
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600'
    }
  ];

  const quickActions = [
    {
      title: 'Add Client',
      href: '/clients',
      icon: Users,
      description: 'Create a new client'
    },
    {
      title: 'New Project',
      href: '/projects',
      icon: Briefcase,
      description: 'Start a new project'
    },
    {
      title: 'Create Proposal',
      href: '/proposals',
      icon: FileText,
      description: 'Send a proposal'
    },
    {
      title: 'Generate Invoice',
      href: '/invoices',
      icon: Receipt,
      description: 'Create an invoice'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ClientDesk</h1>
        <p className="text-muted-foreground">
          Manage your clients, projects, and proposals all in one place.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
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
              <p className="text-sm text-muted-foreground">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(project.clientName ?? '').toUpperCase()} • {(project.status ?? '').toUpperCase()}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }).format(new Date(project.createdAt))}
                    </div>
                  </div>
                ))}
                <Link href="/projects">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Projects
                  </Button>
                </Link>
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
              <p className="text-sm text-muted-foreground">No proposals yet</p>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {proposal.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(proposal.status ?? '').toUpperCase()} • ${parseFloat(proposal.totalAmount ?? '0').toFixed(2)}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }).format(new Date(proposal.createdAt))}
                    </div>
                  </div>
                ))}
                <Link href="/proposals">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Proposals
                  </Button>
                </Link>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Icon className="h-6 w-6" />
                    <div className="text-center">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}