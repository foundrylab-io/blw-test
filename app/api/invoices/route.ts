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
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { projectId, proposalId, invoiceNumber, title, description, status, dueDate, totalAmount, taxAmount, notes } = body;

    if (!projectId || !invoiceNumber || !title) {
      return NextResponse.json(
        { error: 'Project ID, invoice number, and title are required' },
        { status: 400 }
      );
    }

    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        proposalId: proposalId ? parseInt(proposalId) : null,
        invoiceNumber,
        title,
        description: description || '',
        status: status || 'draft',
        dueDate: dueDate ? new Date(dueDate) : null,
        totalAmount: totalAmount || '0',
        taxAmount: taxAmount || '0',
        notes: notes || '',
      })
      .returning();

    return NextResponse.json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}