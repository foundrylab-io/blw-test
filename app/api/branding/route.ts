import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { branding } from '@/lib/db/schema';
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
      .from(branding)
      .where(eq(branding.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Failed to fetch branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding' },
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
    const { companyName, logo, primaryColor, secondaryColor, website, address, phone, email } = body;

    const [newBranding] = await db
      .insert(branding)
      .values({
        userId: currentUser.id,
        companyName,
        logo,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#64748b',
        website,
        address,
        phone,
        email,
      })
      .returning();

    return NextResponse.json(newBranding);
  } catch (error) {
    console.error('Failed to create branding:', error);
    return NextResponse.json(
      { error: 'Failed to create branding' },
      { status: 500 }
    );
  }
}