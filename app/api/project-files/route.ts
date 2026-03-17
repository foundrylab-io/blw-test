import { NextResponse } from 'next/server';
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

    const body = await request.json();
    const {
      projectId,
      filename,
      originalName,
      mimeType,
      fileSize,
      filePath,
      description,
    } = body;

    if (!projectId || !filename || !originalName || !filePath) {
      return NextResponse.json(
        { error: 'Project ID, filename, original name, and file path are required' },
        { status: 400 }
      );
    }

    const [newFile] = await db
      .insert(projectFiles)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        filename,
        originalName,
        mimeType,
        fileSize: fileSize ? parseInt(fileSize) : null,
        filePath,
        description,
      })
      .returning();

    return NextResponse.json(newFile);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create project file' },
      { status: 500 }
    );
  }
}