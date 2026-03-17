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

    const rows = await db
      .select()
      .from(proposals)
      .where(eq(proposals.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch proposals' },
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
    const { clientId, projectId, title, description, status, validUntil, totalAmount } = body;

    if (!title || !clientId) {
      return NextResponse.json(
        { error: 'Title and client ID are required' },
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
      })
      .returning();

    return NextResponse.json(newProposal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}