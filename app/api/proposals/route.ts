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

    const rows = await db.select().from(proposals).where(eq(proposals.userId, user.id));
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    const body = await request.json();
    const { clientId, projectId, title, description, totalAmount, status, sentAt, acceptedAt, rejectedAt, expiresAt } = body;

    if (!clientId || !title || !totalAmount) {
      return NextResponse.json({ error: 'Client ID, title, and total amount are required' }, { status: 400 });
    }

    const [newProposal] = await db.insert(proposals).values({
      userId: user.id,
      clientId,
      projectId,
      title,
      description,
      totalAmount,
      status: status || 'draft',
      sentAt: sentAt ? new Date(sentAt) : null,
      acceptedAt: acceptedAt ? new Date(acceptedAt) : null,
      rejectedAt: rejectedAt ? new Date(rejectedAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    }).returning();

    return NextResponse.json(newProposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}