import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { proposals } from '@/lib/db/schema';
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

    const data = await request.json();
    const { projectId, title, description, status, totalAmount, validUntil } = data;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      );
    }

    const newProposal = await db
      .insert(proposals)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        title,
        description: description || null,
        status: status || 'draft',
        totalAmount: totalAmount || null,
        validUntil: validUntil ? new Date(validUntil) : null,
      })
      .returning();

    return NextResponse.json(newProposal[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create proposal' },
      { status: 500 }
    );
  }
}