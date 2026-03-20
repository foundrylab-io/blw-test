import { db } from '@/lib/db/drizzle';
import { clients, projects, proposals, invoices, files } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq, desc, sql, count, sum } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Receipt, 
  Plus, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch stats
  const [clientCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.userId, currentUser.id));

  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.userId, currentUser.id));

  const [proposalCount] = await db
    .select({ count: count() })
    .from(proposals)
    .where(eq(proposals.userId, currentUser.id));

  const [invoiceData] = await db
    .select({ 
      count: count(),
      total: sum(invoices.totalAmount)
    })
    .from(invoices)
    .where(eq(invoices.userId, currentUser.id));

  // Fetch recent activity
  const recentProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      createdAt: projects.createdAt,
      clientId: clients.id,
      clientName: clients.name
    })
    .from(projects)
    .leftJoin(clients, eq(projects.clientId, clients.id))
    .where(eq(projects.userId, currentUser.id))
    .orderBy(desc(projects.createdAt))
    .limit(5);

  const recentProposals = await db
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      totalAmount: proposals.totalAmount,
      createdAt: proposals.createdAt,
      clientId: clients.id,
      clientName: clients.name
    })
    .from(proposals)
    .leftJoin(clients, eq(proposals.clientId, clients.id))
    .where(eq(proposals.userId, currentUser.id))
    .orderBy(desc(proposals.createdAt))
    .limit(5);

  const recentInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      title: invoices.title,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      createdAt: invoices.createdAt,
      clientId: clients.id,
      clientName: clients.name
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.userId, currentUser.id))
    .orderBy(desc(invoices.createdAt))
    .limit(5);

  const totalRevenue = (invoiceData.total ?? 0);
  const clientsTotal = clientCount.count ?? 0;
  const projectsTotal = projectCount.count ?? 0;
  const proposalsTotal = proposalCount.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to ClientDesk</h1>
        <p className="text-gray-600">Manage your clients, projects, and proposals all in one place</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsTotal}</div>
            <p className="text-xs text-muted-foreground">Active client relationships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsTotal}</div>
            <p className="text-xs text-muted-foreground">Projects in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals Sent</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalsTotal}</div>
            <p className="text-xs text-muted-foreground">Proposals created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(totalRevenue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From all invoices</p>
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
            <Button asChild className="h-auto py-4 flex flex-col gap-2">
              <Link href="/clients">
                <Plus className="h-5 w-5" />
                Add Client
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link href="/projects">
                <Briefcase className="h-5 w-5" />
                New Project
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link href="/proposals">
                <FileText className="h-5 w-5" />
                Create Proposal
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Link href="/invoices">
                <Receipt className="h-5 w-5" />
                Generate Invoice
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects yet</p>
            ) : (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name ?? 'Untitled'}</p>
                      <p className="text-sm text-muted-foreground">
                        {(project.clientName ?? 'Unknown Client')} • {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(project.status ?? 'active') === 'active' && (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                      {(project.status ?? 'active') === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs capitalize text-muted-foreground">
                        {project.status ?? 'active'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Proposals */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProposals.length === 0 ? (
              <p className="text-muted-foreground text-sm">No proposals yet</p>
            ) : (
              <div className="space-y-4">
                {recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{proposal.title ?? 'Untitled'}</p>
                      <p className="text-sm text-muted-foreground">
                        {(proposal.clientName ?? 'Unknown Client')} • ${Number(proposal.totalAmount ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {(proposal.status ?? 'draft') === 'draft' && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      {(proposal.status ?? 'draft') === 'sent' && (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                      {(proposal.status ?? 'draft') === 'accepted' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs capitalize text-muted-foreground">
                        {proposal.status ?? 'draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet</p>
          ) : (
            <div className="space-y-4">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{invoice.invoiceNumber ?? 'No Number'}</p>
                    <p className="text-sm font-medium">{invoice.title ?? 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">
                      {(invoice.clientName ?? 'Unknown Client')} • {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${Number(invoice.totalAmount ?? 0).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      {(invoice.status ?? 'draft') === 'draft' && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      {(invoice.status ?? 'draft') === 'sent' && (
                        <Clock className="h-4 w-4 text-blue-500" />
                      )}
                      {(invoice.status ?? 'draft') === 'paid' && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-xs capitalize text-muted-foreground">
                        {invoice.status ?? 'draft'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}