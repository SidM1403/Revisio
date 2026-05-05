import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { savedNotes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();
    console.log("History API called for user:", userId);
    
    if (!userId) {
      console.warn("History API: No userId found");
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await db.select()
      .from(savedNotes)
      .where(eq(savedNotes.userId, userId))
      .orderBy(desc(savedNotes.createdAt));

    console.log(`History API: Found ${history.length} sessions for user ${userId}`);
    return Response.json(history);
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
