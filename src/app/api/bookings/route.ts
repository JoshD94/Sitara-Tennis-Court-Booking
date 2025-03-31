import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { toZonedTime } from 'date-fns-tz';
import { withAuth } from '../middleware';

const TIMEZONE = 'America/New_York';
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

            // Validate that bookings are only for next week same day
            const today = new Date();
            const nextWeekSameDay = new Date(today);
            nextWeekSameDay.setDate(today.getDate() + 7); // Add 7 days to get next week

            // Get the start and end of the week (Sunday to Saturday)
            const startOfWeek = new Date(nextWeekSameDay);
            startOfWeek.setDate(nextWeekSameDay.getDate() - nextWeekSameDay.getDay()); // Start of week (Sunday)
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

            // Check if all booking slots are for the same day next week
            for (const slot of bookingSlots) {
                const slotDate = new Date(slot.startTime);

                // Create dates without time components, using the application timezone
                const todayInTimezone = toZonedTime(new Date(), TIMEZONE);
                const todayDate = new Date(todayInTimezone);
                todayDate.setHours(0, 0, 0, 0);

                // Convert the slot date to our timezone
                const slotDateInTimezone = toZonedTime(slotDate, TIMEZONE);
                const slotDateOnly = new Date(slotDateInTimezone);
                slotDateOnly.setHours(0, 0, 0, 0);

                // Calculate the expected date (7 days from today)
                const nextWeekDate = new Date(todayDate);
                nextWeekDate.setDate(todayDate.getDate() + 7);

                // For debugging
                console.log("Today (date only):", todayDate.toISOString());
                console.log("Next week expected (date only):", nextWeekDate.toISOString());
                console.log("Slot date (date only):", slotDateOnly.toISOString());

                // Get day numbers
                const dayOfWeekToday = todayDate.getDay();
                const dayOfWeekSlot = slotDateOnly.getDay();
                console.log("Day of week (today):", dayOfWeekToday);
                console.log("Day of week (slot):", dayOfWeekSlot);

                // Check if days match and it's approximately 7 days away
                const diffTime = Math.abs(slotDateOnly.getTime() - todayDate.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                console.log("Difference in days:", diffDays);

                // Exact match required: same day of week AND 7 days difference
                if (dayOfWeekToday !== dayOfWeekSlot || diffDays !== 7) {
                    return NextResponse.json(
                        { error: 'Bookings must be for exactly 7 days from today (same day next week)' },
                        { status: 400 }
                    );
                }

                // Check if booking is between 6am and 9pm
                const slotTimeInTimezone = toZonedTime(slotDate, TIMEZONE);
                const hours = slotTimeInTimezone.getHours();
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

            // Check for overlapping bookings
            const startOfDay = new Date(new Date(bookingSlots[0].startTime).setHours(0, 0, 0, 0));
            const endOfDay = new Date(new Date(bookingSlots[0].startTime).setHours(23, 59, 59, 999));

            const allBookingsForDay = await prisma.booking.findMany({
                where: {
                    startTime: {
                        gte: startOfDay,
                        lt: endOfDay
                    }
                }
            });

            for (const slot of bookingSlots) {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);

                // Check against existing bookings
                for (const existingBooking of allBookingsForDay) {
                    const existingStart = existingBooking.startTime;
                    const existingEnd = existingBooking.endTime;

                    // Check if there's overlap
                    if (
                        (slotStart >= existingStart && slotStart < existingEnd) ||
                        (slotEnd > existingStart && slotEnd <= existingEnd) ||
                        (slotStart <= existingStart && slotEnd >= existingEnd)
                    ) {
                        return NextResponse.json(
                            { error: 'Selected time slot overlaps with an existing booking' },
                            { status: 400 }
                        );
                    }
                }

                // Check against other slots in this request
                for (const otherSlot of bookingSlots) {
                    if (slot === otherSlot) continue;

                    const otherStart = new Date(otherSlot.startTime);
                    const otherEnd = new Date(otherSlot.endTime);

                    if (
                        (slotStart >= otherStart && slotStart < otherEnd) ||
                        (slotEnd > otherStart && slotEnd <= otherEnd) ||
                        (slotStart <= otherStart && slotEnd >= otherEnd)
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