import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { files } from '@/lib/db/schema';
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
      .from(files)
      .where(eq(files.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching files:', error);
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
      projectId,
      name,
      originalName,
      mimeType,
      size,
      url,
      description,
    } = body;

    if (!projectId || !name || !originalName || !mimeType || !size || !url) {
      return NextResponse.json(
        { error: 'Project ID, name, original name, mime type, size, and URL are required' },
        { status: 400 }
      );
    }

    const [newFile] = await db
      .insert(files)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        name,
        originalName,
        mimeType,
        size: parseInt(size),
        url,
        description: description || '',
      })
      .returning();

    return NextResponse.json(newFile);
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}