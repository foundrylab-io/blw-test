import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoiceLineItems } from '@/lib/db/schema';
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
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch invoice line items' },
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
    const { invoiceId, description, quantity, unitPrice, totalPrice, sortOrder } = data;

    if (!invoiceId || !description || !unitPrice || !totalPrice) {
      return NextResponse.json(
        { error: 'Invoice ID, description, unit price, and total price are required' },
        { status: 400 }
      );
    }

    const newLineItem = await db
      .insert(invoiceLineItems)
      .values({
        userId: currentUser.id,
        invoiceId: parseInt(invoiceId),
        description,
        quantity: quantity || '1',
        unitPrice,
        totalPrice,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newLineItem[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create invoice line item' },
      { status: 500 }
    );
  }
}