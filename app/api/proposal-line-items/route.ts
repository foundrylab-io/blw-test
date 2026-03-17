import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposalLineItems } from '@/lib/db/schema';
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
      .from(proposalLineItems)
      .where(eq(proposalLineItems.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch proposal line items' },
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

    const body = await request.json();
    const { proposalId, title, description, quantity, rate, amount, order } = body;

    if (!proposalId || !title || !rate || !amount) {
      return NextResponse.json(
        { error: 'Proposal ID, title, rate, and amount are required' },
        { status: 400 }
      );
    }

    const [newLineItem] = await db
      .insert(proposalLineItems)
      .values({
        userId: currentUser.id,
        proposalId: parseInt(proposalId),
        title,
        description,
        quantity: quantity || '1',
        rate,
        amount,
        order: order || 0,
      })
      .returning();

    return NextResponse.json(newLineItem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create proposal line item' },
      { status: 500 }
    );
  }
}