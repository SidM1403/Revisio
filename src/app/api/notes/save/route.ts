import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { savedNotes, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const existingUser = await db.select().from(users).where(eq(users.id, user.id));
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress || 'unknown@example.com',
        isPremium: (user.publicMetadata?.isPremium as boolean) || false,
      });
    }

    const { content, summary } = await req.json();
    console.log("Saving note with summary length:", summary?.length);

    const newNote = await db.insert(savedNotes).values({
      id: crypto.randomUUID(),
      userId: user.id,
      content,
      summary,
    }).returning();

    return Response.json({ success: true, note: newNote[0] });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
