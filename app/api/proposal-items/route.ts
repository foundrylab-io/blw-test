import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposalItems } from '@/lib/db/schema';
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
      .from(proposalItems)
      .where(eq(proposalItems.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposal items:', error);
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
    const {
      proposalId,
      name,
      description,
      quantity,
      unitPrice,
      totalPrice,
      sortOrder,
    } = body;

    if (!proposalId || !name) {
      return NextResponse.json(
        { error: 'Proposal ID and name are required' },
        { status: 400 }
      );
    }

    const [newProposalItem] = await db
      .insert(proposalItems)
      .values({
        userId: currentUser.id,
        proposalId: parseInt(proposalId),
        name,
        description: description || '',
        quantity: quantity || '1',
        unitPrice: unitPrice || '0',
        totalPrice: totalPrice || '0',
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newProposalItem);
  } catch (error) {
    console.error('Error creating proposal item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}