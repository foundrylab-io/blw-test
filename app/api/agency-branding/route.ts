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

    const rows = await db.select().from(agencyBranding).where(eq(agencyBranding.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching agency branding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const { agencyName, primaryColor, secondaryColor, logoUrl, customDomain } = data;

    const [newBranding] = await db.insert(agencyBranding).values({
      userId: currentUser.id,
      agencyName,
      primaryColor,
      secondaryColor,
      logoUrl,
      customDomain,
    }).returning();

    return NextResponse.json(newBranding);
  } catch (error) {
    console.error('Error creating agency branding:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}