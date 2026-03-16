import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

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

export async function POST(request: Request) {
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

    const data = await request.json();
    const { projectId, proposalId, invoiceNumber, title, description, status, totalAmount, paidAmount, dueDate } = data;

    if (!projectId || !invoiceNumber || !title || !totalAmount) {
      return NextResponse.json(
        { error: 'Project ID, invoice number, title, and total amount are required' },
        { status: 400 }
      );
    }

    const newInvoice = await db
      .insert(invoices)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        proposalId: proposalId ? parseInt(proposalId) : null,
        invoiceNumber,
        title,
        description: description || null,
        status: status || 'draft',
        totalAmount,
        paidAmount: paidAmount || '0',
        dueDate: dueDate ? new Date(dueDate) : null,
      })
      .returning();

    return NextResponse.json(newInvoice[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}