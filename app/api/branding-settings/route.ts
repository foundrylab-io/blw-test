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
    const currentUser = user;

    const rows = await db
      .select()
      .from(brandingSettings)
      .where(eq(brandingSettings.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding settings' },
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
    const { agencyName, primaryColor, logoUrl } = body;

    const [newBrandingSettings] = await db
      .insert(brandingSettings)
      .values({
        userId: currentUser.id,
        agencyName,
        primaryColor: primaryColor || '#3b82f6',
        logoUrl,
      })
      .returning();

    return NextResponse.json(newBrandingSettings);
  } catch (error) {
    console.error('Error creating branding settings:', error);
    return NextResponse.json(
      { error: 'Failed to create branding settings' },
      { status: 500 }
    );
  }
}