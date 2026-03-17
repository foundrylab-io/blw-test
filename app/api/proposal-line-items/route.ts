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

    const rows = await db.select().from(proposalLineItems).where(eq(proposalLineItems.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposal line items:', error);
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
    const { proposalId, description, quantity, rate, amount, order } = data;

    if (!proposalId || !description || !rate || !amount) {
      return NextResponse.json({ error: 'ProposalId, description, rate, and amount are required' }, { status: 400 });
    }

    const [newLineItem] = await db.insert(proposalLineItems).values({
      userId: currentUser.id,
      proposalId,
      description,
      quantity: quantity || '1',
      rate,
      amount,
      order: order || 0,
    }).returning();

    return NextResponse.json(newLineItem);
  } catch (error) {
    console.error('Error creating proposal line item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}