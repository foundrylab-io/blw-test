import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { projectFiles } from '@/lib/db/schema';
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
      .from(projectFiles)
      .where(eq(projectFiles.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project files' },
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
    const { projectId, fileName, originalName, fileSize, mimeType, fileUrl, description, isPublic } = data;

    if (!projectId || !fileName || !originalName || !fileSize || !fileUrl) {
      return NextResponse.json(
        { error: 'Project ID, file name, original name, file size, and file URL are required' },
        { status: 400 }
      );
    }

    const newFile = await db
      .insert(projectFiles)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        fileName,
        originalName,
        fileSize: parseInt(fileSize),
        mimeType: mimeType || null,
        fileUrl,
        description: description || null,
        isPublic: isPublic || false,
      })
      .returning();

    return NextResponse.json(newFile[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project file' },
      { status: 500 }
    );
  }
}