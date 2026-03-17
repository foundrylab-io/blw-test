import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db/drizzle';
import { projectFiles } from '@/lib/db/schema';
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
      .from(projectFiles)
      .where(eq(projectFiles.userId, currentUser.id));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching project files:', error);
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
    const { projectId, fileName, originalName, fileSize, mimeType, fileUrl, isPublic } = body;

    if (!projectId || !fileName || !originalName || !mimeType || !fileUrl) {
      return NextResponse.json(
        { error: 'Project ID, file name, original name, mime type, and file URL are required' },
        { status: 400 }
      );
    }

    const [newFile] = await db
      .insert(projectFiles)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        fileName,
        originalName,
        fileSize: fileSize || 0,
        mimeType,
        fileUrl,
        isPublic: isPublic || false,
      })
      .returning();

    return NextResponse.json(newFile);
  } catch (error) {
    console.error('Error creating project file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}