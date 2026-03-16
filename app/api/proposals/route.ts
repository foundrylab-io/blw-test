import { NextRequest, NextResponse } from 'next/server';
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

    const rows = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
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
    const { clientId, projectId, title, description, status, validUntil, totalAmount, sentAt, viewedAt, acceptedAt } = body;

    if (!title || !clientId || !totalAmount) {
      return NextResponse.json(
        { error: 'Title, client ID, and total amount are required' },
        { status: 400 }
      );
    }

    const [newProposal] = await db
      .insert(proposals)
      .values({
        userId: currentUser.id,
        clientId: parseInt(clientId),
        projectId: projectId ? parseInt(projectId) : null,
        title,
        description,
        status: status || 'draft',
        validUntil: validUntil ? new Date(validUntil) : null,
        totalAmount,
        sentAt: sentAt ? new Date(sentAt) : null,
        viewedAt: viewedAt ? new Date(viewedAt) : null,
        acceptedAt: acceptedAt ? new Date(acceptedAt) : null,
      })
      .returning();

    return NextResponse.json(newProposal);
  } catch (error) {
    console.error('Error creating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}