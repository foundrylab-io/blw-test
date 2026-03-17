import { NextRequest, NextResponse } from 'next/server';
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
    console.error('Error fetching project files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project files' },
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
      projectId,
      name,
      originalName,
      mimeType,
      size,
      url,
      folder,
      isPublic
    } = data;

    if (!projectId || !name || !originalName || !mimeType || !url) {
      return NextResponse.json(
        { error: 'Project ID, name, original name, mime type, and URL are required' },
        { status: 400 }
      );
    }

    const [newProjectFile] = await db
      .insert(projectFiles)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        name,
        originalName,
        mimeType,
        size: size || 0,
        url,
        folder: folder || '',
        isPublic: isPublic || false,
      })
      .returning();

    return NextResponse.json(newProjectFile, { status: 201 });
  } catch (error) {
    console.error('Error creating project file:', error);
    return NextResponse.json(
      { error: 'Failed to create project file' },
      { status: 500 }
    );
  }
}