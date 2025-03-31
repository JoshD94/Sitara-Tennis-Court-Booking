import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function validateToken(token: string) {
    if (!token) {
        return null;
    }

    try {
        // Find user with matching token that hasn't expired
        const user = await prisma.user.findFirst({
            where: {
                authToken: token,
                tokenExpiry: {
                    gt: new Date() // Token hasn't expired
                }
            }
        });

        return user;
    } catch (error) {
        console.error('Token validation error:', error);
        return null;
    }
}

export async function withAuth(request: Request, handler: (userId: string, req: Request) => Promise<NextResponse>) {
    try {
        // Get token from Authorization header
        const authHeader = request.headers.get('Authorization');
        const token = authHeader ? authHeader.split(' ')[1] : null;

        if (!token) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const user = await validateToken(token);

        if (!user) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // Call the handler with the authenticated user ID
        return handler(user.id, request);
    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }
}