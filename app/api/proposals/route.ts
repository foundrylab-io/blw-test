import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposals } from '@/lib/db/schema';
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

    const rows = await db.select().from(proposals).where(eq(proposals.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
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
    const { clientId, projectId, title, description, status, validUntil, totalAmount } = data;

    if (!title || !clientId) {
      return NextResponse.json({ error: 'Title and clientId are required' }, { status: 400 });
    }

    const [newProposal] = await db.insert(proposals).values({
      userId: currentUser.id,
      clientId,
      projectId,
      title,
      description,
      status: status || 'draft',
      validUntil: validUntil ? new Date(validUntil) : null,
      totalAmount: totalAmount || '0',
    }).returning();

    return NextResponse.json(newProposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}