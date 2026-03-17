import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoiceItems } from '@/lib/db/schema';
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
      .from(invoiceItems)
      .where(eq(invoiceItems.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice items' },
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
    const { invoiceId, name, description, quantity, rate, amount, sortOrder } = data;

    if (!invoiceId || !name) {
      return NextResponse.json(
        { error: 'Invoice ID and name are required' },
        { status: 400 }
      );
    }

    const [newInvoiceItem] = await db
      .insert(invoiceItems)
      .values({
        userId: currentUser.id,
        invoiceId: parseInt(invoiceId),
        name,
        description: description || '',
        quantity: quantity || '1',
        rate: rate || '0',
        amount: amount || '0',
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newInvoiceItem, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }
}