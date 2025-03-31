import { Booking } from "./booking";

export type User = {
    id: string;
    email: string;
    password: string;
    name?: string;
    address?: string;
    authToken: string;
    createdAt: Date;
    updatedAt: Date;
    bookings: Booking[];
    bookingQuota: number;
}