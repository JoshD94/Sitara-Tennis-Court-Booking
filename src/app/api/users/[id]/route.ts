import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateToken } from '../../middleware';

// Create Prisma client instance
// Note: In production, you should use a singleton pattern to avoid too many connections
const prisma = new PrismaClient();

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        // Get token from header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader ? authHeader.split(' ')[1] : null;

        // Get the user ID from the route - in Next.js 15, params is a Promise that needs to be awaited
        const params = await context.params;
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // If token is provided, validate it
        if (token) {
            const authenticatedUser = await validateToken(token);

            // Only allow users to access their own data
            if (authenticatedUser && authenticatedUser.id === id) {
                const user = await prisma.user.findUnique({
                    where: { id },
                    include: { bookings: true },
                });

                return NextResponse.json(user);
            }
        }

        // For unauthenticated requests, return limited data
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                bookingQuota: true,
                // Don't include email, password, or other sensitive data
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: `Failed to fetch user ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}