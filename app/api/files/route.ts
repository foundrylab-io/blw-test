import { NextResponse } from 'next/server';
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

    const rows = await db.select().from(files).where(eq(files.userId, currentUser.id));
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching files:', error);
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
    const { projectId, name, originalName, mimeType, size, url, description } = data;

    if (!projectId || !name || !originalName || !url) {
      return NextResponse.json({ error: 'ProjectId, name, originalName, and url are required' }, { status: 400 });
    }

    const [newFile] = await db.insert(files).values({
      userId: currentUser.id,
      projectId,
      name,
      originalName,
      mimeType,
      size,
      url,
      description,
    }).returning();

    return NextResponse.json(newFile);
  } catch (error) {
    console.error('Error creating file:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}