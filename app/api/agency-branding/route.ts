import { NextRequest, NextResponse } from 'next/server';
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
    console.error('Error fetching agency branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency branding' },
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

    const data = await request.json();
    const {
      agencyName,
      logoUrl,
      primaryColor,
      secondaryColor,
      website,
      address,
      phone,
      email
    } = data;

    if (!agencyName) {
      return NextResponse.json(
        { error: 'Agency name is required' },
        { status: 400 }
      );
    }

    const [newAgencyBranding] = await db
      .insert(agencyBranding)
      .values({
        userId: currentUser.id,
        agencyName,
        logoUrl: logoUrl || '',
        primaryColor: primaryColor || '#3b82f6',
        secondaryColor: secondaryColor || '#64748b',
        website: website || '',
        address: address || '',
        phone: phone || '',
        email: email || '',
      })
      .returning();

    return NextResponse.json(newAgencyBranding, { status: 201 });
  } catch (error) {
    console.error('Error creating agency branding:', error);
    return NextResponse.json(
      { error: 'Failed to create agency branding' },
      { status: 500 }
    );
  }
}