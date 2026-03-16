import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposalItems, proposals } from '@/lib/db/schema';
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
        id: proposalItems.id,
        proposalId: proposalItems.proposalId,
        description: proposalItems.description,
        quantity: proposalItems.quantity,
        unitPrice: proposalItems.unitPrice,
        totalPrice: proposalItems.totalPrice,
        sortOrder: proposalItems.sortOrder,
      })
      .from(proposalItems)
      .innerJoin(proposals, eq(proposalItems.proposalId, proposals.id))
      .where(eq(proposals.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposal items:', error);
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
    const { proposalId, description, quantity, unitPrice, totalPrice, sortOrder } = body;

    if (!proposalId || !description || !unitPrice || !totalPrice) {
      return NextResponse.json(
        { error: 'Proposal ID, description, unit price, and total price are required' },
        { status: 400 }
      );
    }

    // Verify the proposal belongs to the current user
    const proposal = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, parseInt(proposalId)))
      .limit(1);

    if (!proposal.length || proposal[0].userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Proposal not found or unauthorized' },
        { status: 403 }
      );
    }

    const [newProposalItem] = await db
      .insert(proposalItems)
      .values({
        proposalId: parseInt(proposalId),
        description,
        quantity: quantity || '1',
        unitPrice,
        totalPrice,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(newProposalItem);
  } catch (error) {
    console.error('Error creating proposal item:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal item' },
      { status: 500 }
    );
  }
}