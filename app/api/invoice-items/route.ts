import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { invoiceItems, invoices } from '@/lib/db/schema';
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
      .select({
        id: invoiceItems.id,
        invoiceId: invoiceItems.invoiceId,
        description: invoiceItems.description,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
        totalPrice: invoiceItems.totalPrice,
        sortOrder: invoiceItems.sortOrder,
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .where(eq(invoices.userId, currentUser.id));

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

    const body = await request.json();
    const { invoiceId, description, quantity, unitPrice, totalPrice, sortOrder } = body;

    if (!invoiceId || !description || !unitPrice || !totalPrice) {
      return NextResponse.json(
        { error: 'Invoice ID, description, unit price, and total price are required' },
        { status: 400 }
      );
    }

    // Verify the invoice belongs to the current user
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, parseInt(invoiceId)))
      .limit(1);

    if (!invoice.length || invoice[0].userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Invoice not found or unauthorized' },
        { status: 403 }
      );
    }

    const [newInvoiceItem] = await db
      .insert(invoiceItems)
      .values({
        invoiceId: parseInt(invoiceId),
        description,
        quantity: quantity || '1',
        unitPrice,
        totalPrice,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newInvoiceItem);
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }
}