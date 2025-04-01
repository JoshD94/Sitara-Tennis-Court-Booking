import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { toZonedTime, format } from 'date-fns-tz';
import { addDays } from 'date-fns';
import { withAuth } from '../middleware';

const TIMEZONE = 'Asia/Jakarta';
const prisma = new PrismaClient();

export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            include: { user: true },
            orderBy: { startTime: 'asc' },
        });
        return NextResponse.json(bookings);
    } catch (error) {
        return NextResponse.json({
            error: `Failed to fetch bookings: ${error instanceof Error ? error.message : String(error)}`
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    return withAuth(request, async (userId, req) => {
        try {
            // Check if current time is between 6pm and 11:59pm
            const currentTimeUTC = new Date();
            const currentTime = toZonedTime(currentTimeUTC, TIMEZONE);

            const bookingOpensAt = new Date(currentTime);
            bookingOpensAt.setHours(18, 0, 0, 0); // 6pm time

            const bookingClosesAt = new Date(currentTime);
            bookingClosesAt.setHours(23, 59, 59, 999); // 11:59pm time

            // Temporarily comment out for testing
            /*
            if (currentTime < bookingOpensAt || currentTime > bookingClosesAt) {
                return NextResponse.json(
                    { error: `Booking is only available between 6:00 PM and 11:59 PM ${TIMEZONE} time` },
                    { status: 400 }
                );
            }
            */

            const body = await req.json();
            const { bookingSlots } = body;

            if (!bookingSlots || !Array.isArray(bookingSlots) || bookingSlots.length === 0) {
                return NextResponse.json(
                    { error: 'Missing required fields' },
                    { status: 400 }
                );
            }

            // Calculate the valid booking range: from tomorrow to 7 days from today
            const todayInTimezone = toZonedTime(new Date(), TIMEZONE);
            const tomorrow = new Date(todayInTimezone);
            tomorrow.setDate(todayInTimezone.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // Start of tomorrow

            const nextWeekSameDay = new Date(todayInTimezone);
            nextWeekSameDay.setDate(todayInTimezone.getDate() + 7);
            nextWeekSameDay.setHours(23, 59, 59, 999); // End of next week same day

            // Calculate weekly quota period (Sunday to Saturday)
            const dayOfWeek = todayInTimezone.getDay(); // 0 for Sunday, 1 for Monday, etc.

            // Find the most recent Sunday (start of current week)
            const startOfWeek = new Date(todayInTimezone);
            startOfWeek.setDate(todayInTimezone.getDate() - dayOfWeek); // Move back to Sunday
            startOfWeek.setHours(0, 0, 0, 0); // Start of day

            // End of week is Saturday
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
            endOfWeek.setHours(23, 59, 59, 999); // End of day

            // Check if booking slots are within the allowed date range
            for (const slot of bookingSlots) {
                const slotDate = new Date(slot.startTime);
                const slotDateInTimezone = toZonedTime(slotDate, TIMEZONE);

                // For debugging
                console.log("Tomorrow (min date):", tomorrow.toISOString());
                console.log("Next week (max date):", nextWeekSameDay.toISOString());
                console.log("Slot date:", slotDateInTimezone.toISOString());

                // Check if booking date is within the allowed range
                if (slotDateInTimezone < tomorrow || slotDateInTimezone > nextWeekSameDay) {
                    return NextResponse.json(
                        { error: 'Bookings must be between tomorrow and 7 days from today' },
                        { status: 400 }
                    );
                }

                // Check if booking is between 6am and 9pm
                const hours = slotDateInTimezone.getHours();
                if (hours < 6 || hours >= 21) {
                    return NextResponse.json(
                        { error: 'Bookings must be between 6am and 9pm' },
                        { status: 400 }
                    );
                }

                // Check if booking starts on the hour
                if (slotDate.getMinutes() !== 0 || slotDate.getSeconds() !== 0) {
                    return NextResponse.json(
                        { error: 'Bookings must start on the hour' },
                        { status: 400 }
                    );
                }

                // Check if end time is 1 or 2 hours after start time
                const endTime = new Date(slot.endTime);
                const durationHours = (endTime.getTime() - slotDate.getTime()) / (1000 * 60 * 60);
                if (durationHours !== 1 && durationHours !== 2) {
                    return NextResponse.json(
                        { error: 'Bookings must be 1 or 2 hours long' },
                        { status: 400 }
                    );
                }
            }

            // Get user's existing bookings for this week
            const existingBookings = await prisma.booking.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: startOfWeek,
                        lte: endOfWeek,
                    }
                }
            });

            // Calculate total hours already booked this week
            let hoursAlreadyBooked = 0;
            for (const booking of existingBookings) {
                const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60);
                hoursAlreadyBooked += duration;
            }

            // Calculate total hours in new booking request
            let newBookingHours = 0;
            for (const slot of bookingSlots) {
                const startTime = new Date(slot.startTime);
                const endTime = new Date(slot.endTime);
                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                newBookingHours += duration;
            }

            // Get user's quota
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                );
            }

            // Check if user would exceed their quota
            if (hoursAlreadyBooked + newBookingHours > user.bookingQuota) {
                return NextResponse.json(
                    { error: `Booking exceeds your weekly quota of ${user.bookingQuota} hours` },
                    { status: 400 }
                );
            }

            // Check for overlapping bookings with unique days
            const bookingDays = new Map();

            for (const slot of bookingSlots) {
                const slotStartTime = new Date(slot.startTime);
                const slotEndTime = new Date(slot.endTime);

                // Get date string for this booking day
                const slotDateStr = slotStartTime.toISOString().split('T')[0];

                // If we haven't processed this day yet, check for overlaps
                if (!bookingDays.has(slotDateStr)) {
                    const startOfDay = new Date(slotStartTime);
                    startOfDay.setHours(0, 0, 0, 0);

                    const endOfDay = new Date(slotStartTime);
                    endOfDay.setHours(23, 59, 59, 999);

                    // Get all existing bookings for this day
                    const existingDayBookings = await prisma.booking.findMany({
                        where: {
                            startTime: {
                                gte: startOfDay,
                                lt: endOfDay
                            }
                        }
                    });

                    // Store this day's bookings
                    bookingDays.set(slotDateStr, existingDayBookings);
                }

                // Get existing bookings for this day
                const existingDayBookings = bookingDays.get(slotDateStr);

                // Check against existing bookings
                for (const existingBooking of existingDayBookings) {
                    const existingStart = existingBooking.startTime;
                    const existingEnd = existingBooking.endTime;

                    // Check if there's overlap
                    if (
                        (slotStartTime >= existingStart && slotStartTime < existingEnd) ||
                        (slotEndTime > existingStart && slotEndTime <= existingEnd) ||
                        (slotStartTime <= existingStart && slotEndTime >= existingEnd)
                    ) {
                        return NextResponse.json(
                            { error: 'Selected time slot overlaps with an existing booking' },
                            { status: 400 }
                        );
                    }
                }

                // Check against other slots in this request for the same day
                for (const otherSlot of bookingSlots) {
                    if (slot === otherSlot) continue;

                    const otherStartTime = new Date(otherSlot.startTime);
                    const otherDateStr = otherStartTime.toISOString().split('T')[0];

                    // Only check overlaps for slots on the same day
                    if (slotDateStr !== otherDateStr) continue;

                    const otherEndTime = new Date(otherSlot.endTime);

                    if (
                        (slotStartTime >= otherStartTime && slotStartTime < otherEndTime) ||
                        (slotEndTime > otherStartTime && slotEndTime <= otherEndTime) ||
                        (slotStartTime <= otherStartTime && slotEndTime >= otherEndTime)
                    ) {
                        return NextResponse.json(
                            { error: 'Selected time slots overlap with each other' },
                            { status: 400 }
                        );
                    }
                }
            }

            // Create bookings
            const createdBookings = [];
            for (const slot of bookingSlots) {
                const booking = await prisma.booking.create({
                    data: {
                        userId,
                        startTime: new Date(slot.startTime),
                        endTime: new Date(slot.endTime),
                    },
                });
                createdBookings.push(booking);
            }

            return NextResponse.json(createdBookings, { status: 201 });
        } catch (error) {
            console.error('Booking creation error:', error);
            return NextResponse.json(
                { error: 'Failed to create booking' },
                { status: 500 }
            );
        }
    });
}