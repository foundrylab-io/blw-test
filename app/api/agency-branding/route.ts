import { NextRequest, NextResponse } from 'next/server';
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
    console.error('Error fetching agency branding:', error);
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
    const { 
      agencyName, 
      primaryColor, 
      secondaryColor, 
      logoUrl, 
      websiteUrl, 
      address, 
      phone, 
      email 
    } = body;

    if (!agencyName) {
      return NextResponse.json(
        { error: 'Agency name is required' },
        { status: 400 }
      );
    }

    const [newBranding] = await db
      .insert(agencyBranding)
      .values({
        userId: currentUser.id,
        agencyName,
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#6b7280',
        logoUrl: logoUrl || '',
        websiteUrl: websiteUrl || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
      })
      .returning();

    return NextResponse.json(newBranding);
  } catch (error) {
    console.error('Error creating agency branding:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}