import { z } from "zod";

export const PROPERTY_TYPES = [
  "APARTMENT",
  "OFFICE",
  "BUILDING",
  "HOUSE",
  "COMMERCIAL",
  "LAND",
] as const;

export const ROOM_TYPES = [
  "BEDROOM",
  "BATHROOM",
  "KITCHEN",
  "DINING_ROOM",
  "SITTING_ROOM",
  "PARKING",
  "GARDEN",
  "BALCONY",
  "OTHER",
] as const;

export const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPES)[number], string> = {
  BEDROOM: "Bedroom",
  BATHROOM: "Bathroom",
  KITCHEN: "Kitchen",
  DINING_ROOM: "Dining Room",
  SITTING_ROOM: "Sitting Room",
  PARKING: "Parking",
  GARDEN: "Garden",
  BALCONY: "Balcony",
  OTHER: "Other",
};

export const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  phone: z.string().min(7, "A valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["OWNER", "TENANT"]).default("OWNER"),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: "You must accept the terms to continue" }) }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const propertySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(PROPERTY_TYPES),
  address: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(3),
  sizeSqft: z.coerce.number().int().positive().optional(),
  numUnits: z.coerce.number().int().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  roomTypes: z.array(z.enum(ROOM_TYPES)).optional().default([]),
  price: z.coerce.number().positive().optional(),
  priceType: z.string().optional(),
  images: z
    .array(z.object({ url: z.string().url(), publicId: z.string(), type: z.enum(["IMAGE", "VIDEO"]).optional().default("IMAGE") }))
    .optional(),
});

export const inquirySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Enter the 6-digit code"),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type InquiryInput = z.infer<typeof inquirySchema>;
