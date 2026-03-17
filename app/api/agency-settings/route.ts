import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { agencySettings } from '@/lib/db/schema';
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
      .from(agencySettings)
      .where(eq(agencySettings.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching agency settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    const { agencyName, logoUrl, primaryColor, secondaryColor, website, address, phone, email, taxId } = body;

    const [newSettings] = await db
      .insert(agencySettings)
      .values({
        userId: currentUser.id,
        agencyName: agencyName || '',
        logoUrl: logoUrl || '',
        primaryColor: primaryColor || '#000000',
        secondaryColor: secondaryColor || '#ffffff',
        website: website || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
        taxId: taxId || '',
      })
      .returning();

    return NextResponse.json(newSettings);
  } catch (error) {
    console.error('Error creating agency settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}