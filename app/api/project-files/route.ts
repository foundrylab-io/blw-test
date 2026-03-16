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

    const body = await request.json();
    const { projectId, fileName, fileUrl, fileSize, mimeType, description } = body;

    if (!projectId || !fileName || !fileUrl || !fileSize) {
      return NextResponse.json(
        { error: 'Project ID, file name, file URL, and file size are required' },
        { status: 400 }
      );
    }

    const [newProjectFile] = await db
      .insert(projectFiles)
      .values({
        userId: currentUser.id,
        projectId: parseInt(projectId),
        fileName,
        fileUrl,
        fileSize: parseInt(fileSize),
        mimeType,
        description,
      })
      .returning();

    return NextResponse.json(newProjectFile);
  } catch (error) {
    console.error('Error creating project file:', error);
    return NextResponse.json(
      { error: 'Failed to create project file' },
      { status: 500 }
    );
  }
}