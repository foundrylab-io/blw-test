import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposalItems } from '@/lib/db/schema';
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
      .from(proposalItems)
      .where(eq(proposalItems.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch proposal items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposal items' },
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
    const { proposalId, name, description, quantity, rate, amount, sortOrder } = body;

    if (!proposalId || !name || !rate || !amount) {
      return NextResponse.json(
        { error: 'Proposal ID, name, rate, and amount are required' },
        { status: 400 }
      );
    }

    const [newProposalItem] = await db
      .insert(proposalItems)
      .values({
        userId: currentUser.id,
        proposalId: parseInt(proposalId),
        name,
        description,
        quantity: quantity || '1',
        rate,
        amount,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newProposalItem);
  } catch (error) {
    console.error('Failed to create proposal item:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal item' },
      { status: 500 }
    );
  }
}