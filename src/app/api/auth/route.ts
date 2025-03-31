import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate a random token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // New user - create an account
            const hashedPassword = await bcrypt.hash(password, 10);
            const token = generateToken();
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 30); // Token expires in 30 days

            user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    bookingQuota: 3, // Default quota
                    authToken: token,
                    tokenExpiry
                }
            });

            return NextResponse.json({
                user: {
                    id: user.id,
                    email: user.email,
                    bookingQuota: user.bookingQuota
                },
                token,
                isNewUser: true
            });
        } else {
            // Existing user - verify password
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return NextResponse.json(
                    { error: 'Invalid password' },
                    { status: 401 }
                );
            }

            // Generate a new token
            const token = generateToken();
            const tokenExpiry = new Date();
            tokenExpiry.setDate(tokenExpiry.getDate() + 30); // Token expires in 30 days

            // Update user with new token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    authToken: token,
                    tokenExpiry
                }
            });

            return NextResponse.json({
                user: {
                    id: user.id,
                    email: user.email,
                    bookingQuota: user.bookingQuota
                },
                token,
                isNewUser: false
            });
        }
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}