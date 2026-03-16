import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoiceItems } from '@/lib/db/schema';
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

    const rows = await db.select().from(invoiceItems).where(eq(invoiceItems.userId, user.id));
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
    const { invoiceId, name, description, quantity, unitPrice, totalPrice, sortOrder } = body;

    if (!invoiceId || !name || !unitPrice || !totalPrice) {
      return NextResponse.json({ error: 'Invoice ID, name, unit price, and total price are required' }, { status: 400 });
    }

    const [newInvoiceItem] = await db.insert(invoiceItems).values({
      userId: user.id,
      invoiceId,
      name,
      description,
      quantity: quantity || '1',
      unitPrice,
      totalPrice,
      sortOrder: sortOrder || 0,
    }).returning();

    return NextResponse.json(newInvoiceItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}