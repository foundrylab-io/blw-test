import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoiceLineItems } from '@/lib/db/schema';
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

    const rows = await db.select().from(invoiceLineItems).where(eq(invoiceLineItems.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching invoice line items:', error);
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
    const { invoiceId, description, quantity, rate, amount, order } = data;

    if (!invoiceId || !description || !rate || !amount) {
      return NextResponse.json({ error: 'InvoiceId, description, rate, and amount are required' }, { status: 400 });
    }

    const [newLineItem] = await db.insert(invoiceLineItems).values({
      userId: currentUser.id,
      invoiceId,
      description,
      quantity: quantity || '1',
      rate,
      amount,
      order: order || 0,
    }).returning();

    return NextResponse.json(newLineItem);
  } catch (error) {
    console.error('Error creating invoice line item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}