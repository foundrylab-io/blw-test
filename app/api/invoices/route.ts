import { NextRequest, NextResponse } from 'next/server';
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
    console.error('Error fetching invoices:', error);
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

    const data = await request.json();
    const {
      clientId,
      projectId,
      proposalId,
      invoiceNumber,
      title,
      description,
      status,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      dueDate
    } = data;

    if (!clientId || !invoiceNumber || !title || !dueDate) {
      return NextResponse.json(
        { error: 'Client ID, invoice number, title, and due date are required' },
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
        totalAmount: totalAmount || '0',
        dueDate: new Date(dueDate),
      })
      .returning();

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}