import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { getUser } from '@/lib/db/queries';
import { clients, projects, proposals, invoices, activityLogs } from '@/lib/db/schema';
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
  Activity 
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/sign-in');
  const currentUser = user;

  // Fetch stats
  const [
    clientsCount,
    projectsCount,
    proposalsCount,
    invoicesCount,
    totalRevenue,
    recentProposals,
    recentInvoices,
    recentActivity
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db
      .select({ count: count() })
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db
      .select({ count: count() })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id))
      .then(result => result[0]?.count ?? 0),
    
    db
      .select({ total: sum(invoices.totalAmount) })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id))
      .then(result => result[0]?.total ?? '0'),
    
    db
      .select({
        id: proposals.id,
        title: proposals.title,
        status: proposals.status,
        totalAmount: proposals.totalAmount,
        createdAt: proposals.createdAt
      })
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id))
      .orderBy(desc(proposals.createdAt))
      .limit(5),
    
    db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        title: invoices.title,
        status: invoices.status,
        totalAmount: invoices.totalAmount,
        createdAt: invoices.createdAt
      })
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id))
      .orderBy(desc(invoices.createdAt))
      .limit(5),
    
    db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        timestamp: activityLogs.timestamp
      })
      .from(activityLogs)
      .where(eq(activityLogs.userId, currentUser.id))
      .orderBy(desc(activityLogs.timestamp))
      .limit(5)
  ]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome to ClientDesk</h1>
        <p className="text-gray-600 mt-2">
          Manage your clients, projects, and proposals all in one place
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proposalsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(parseFloat(totalRevenue ?? '0')).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/clients">
            <Button className="w-full h-20 flex flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Manage Clients</span>
            </Button>
          </Link>
          <Link href="/projects">
            <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
              <Briefcase className="h-6 w-6" />
              <span>View Projects</span>
            </Button>
          </Link>
          <Link href="/proposals">
            <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
              <FileText className="h-6 w-6" />
              <span>Create Proposal</span>
            </Button>
          </Link>
          <Link href="/invoices">
            <Button className="w-full h-20 flex flex-col gap-2" variant="outline">
              <Receipt className="h-6 w-6" />
              <span>Generate Invoice</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <p className="text-gray-500 text-center py-4">No proposals yet</p>
            ) : (
              <div className="space-y-3">
                {recentProposals.map((proposal) => (
                  <div key={proposal.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{proposal.title ?? 'Untitled'}</p>
                      <p className="text-sm text-gray-500 capitalize">{proposal.status ?? 'draft'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(parseFloat(proposal.totalAmount ?? '0')).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }).format(new Date(proposal.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No invoices yet</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber ?? 'N/A'}</p>
                      <p className="text-sm text-gray-500">{invoice.title ?? 'Untitled'}</p>
                      <p className="text-xs text-gray-500 capitalize">{invoice.status ?? 'draft'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(parseFloat(invoice.totalAmount ?? '0')).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Intl.DateTimeFormat('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }).format(new Date(invoice.createdAt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Log */}
      {recentActivity.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm">{(activity.action ?? '').replace('_', ' ').toLowerCase()}</p>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      }).format(new Date(activity.timestamp))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}