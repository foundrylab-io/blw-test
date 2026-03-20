import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUser = user;

    const rows = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUser = user;

    const body = await request.json();
    const { clientId, projectId, proposalId, invoiceNumber, title, description, status, subtotal, taxRate, taxAmount, total, issueDate, dueDate } = body;

    if (!clientId || !invoiceNumber || !title) {
      return NextResponse.json(
        { error: 'Client ID, invoice number, and title are required' },
        { status: 400 }
      );
    }

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId: currentUser.id,
        clientId: parseInt(clientId),
        projectId: projectId ? parseInt(projectId) : null,
        proposalId: proposalId ? parseInt(proposalId) : null,
        invoiceNumber,
        title,
        description: description || '',
        status: status || 'draft',
        subtotal: subtotal || '0',
        taxRate: taxRate || '0',
        taxAmount: taxAmount || '0',
        total: total || '0',
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        dueDate: new Date(dueDate),
      })
      .returning();

    return NextResponse.json(newInvoice);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}