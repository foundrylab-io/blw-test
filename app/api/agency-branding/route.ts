import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { agencyBranding } from '@/lib/db/schema';
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

    const data = await request.json();
    const { agencyName, primaryColor, logoUrl, website, address, phone, email } = data;

    const newBranding = await db
      .insert(agencyBranding)
      .values({
        userId: currentUser.id,
        agencyName: agencyName || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        website: website || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
      })
      .returning();

    return NextResponse.json(newBranding[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create agency branding' },
      { status: 500 }
    );
  }
}