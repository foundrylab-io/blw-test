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

    const rows = await db.select().from(invoices).where(eq(invoices.userId, user.id));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const body = await request.json();
    const { clientId, projectId, proposalId, invoiceNumber, title, description, subtotal, taxAmount, totalAmount, status, dueDate, paidAt, sentAt } = body;

    if (!clientId || !invoiceNumber || !title || !subtotal || !totalAmount) {
      return NextResponse.json({ error: 'Client ID, invoice number, title, subtotal, and total amount are required' }, { status: 400 });
    }

    const [newInvoice] = await db.insert(invoices).values({
      userId: user.id,
      clientId,
      projectId,
      proposalId,
      invoiceNumber,
      title,
      description,
      subtotal,
      taxAmount: taxAmount || '0',
      totalAmount,
      status: status || 'draft',
      dueDate: dueDate ? new Date(dueDate) : null,
      paidAt: paidAt ? new Date(paidAt) : null,
      sentAt: sentAt ? new Date(sentAt) : null,
    }).returning();

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}