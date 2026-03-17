import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
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
      .from(agencyBranding)
      .where(eq(agencyBranding.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agency branding' },
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
    const {
      agencyName,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      customDomain,
      isActive,
    } = body;

    const [newBranding] = await db
      .insert(agencyBranding)
      .values({
        userId: currentUser.id,
        agencyName,
        primaryColor,
        secondaryColor,
        logoUrl,
        faviconUrl,
        customDomain,
        isActive: isActive || false,
      })
      .returning();

    return NextResponse.json(newBranding);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agency branding' },
      { status: 500 }
    );
  }
}