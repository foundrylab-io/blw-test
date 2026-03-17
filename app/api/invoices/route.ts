import { NextResponse } from 'next/server';
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

    const rows = await db.select().from(invoices).where(eq(invoices.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const { clientId, projectId, proposalId, invoiceNumber, title, description, status, totalAmount, paidAmount, dueDate } = data;

    if (!clientId || !invoiceNumber || !title) {
      return NextResponse.json({ error: 'ClientId, invoiceNumber, and title are required' }, { status: 400 });
    }

    const [newInvoice] = await db.insert(invoices).values({
      userId: currentUser.id,
      clientId,
      projectId,
      proposalId,
      invoiceNumber,
      title,
      description,
      status: status || 'draft',
      totalAmount: totalAmount || '0',
      paidAmount: paidAmount || '0',
      dueDate: dueDate ? new Date(dueDate) : null,
    }).returning();

    return NextResponse.json(newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}