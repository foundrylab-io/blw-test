import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { brandingSettings } from '@/lib/db/schema';
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

    const rows = await db.select().from(brandingSettings).where(eq(brandingSettings.userId, user.id));
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
    const { companyName, logoUrl, primaryColor, secondaryColor, accentColor, customDomain, isEnabled } = body;

    const [newBrandingSetting] = await db.insert(brandingSettings).values({
      userId: user.id,
      companyName,
      logoUrl,
      primaryColor: primaryColor || '#3B82F6',
      secondaryColor: secondaryColor || '#64748B',
      accentColor: accentColor || '#10B981',
      customDomain,
      isEnabled: isEnabled || false,
    }).returning();

    return NextResponse.json(newBrandingSetting, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}