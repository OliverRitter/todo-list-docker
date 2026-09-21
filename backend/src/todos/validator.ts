import { z } from "zod";

const coordinate = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .refine((value) => {
      const numericValue = Number(value);
      return (
        Number.isFinite(numericValue) &&
        numericValue >= min &&
        numericValue <= max
      );
    })
    .transform(Number);

export const backendTaskSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["Work", "Shopping", "Personal"]),
  dueDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Due date must be a valid date",
    }),
  lat: coordinate(-90, 90),
  lng: coordinate(-180, 180),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

export const todoIdSchema = z.string().uuid();

export const mapBoundsSchema = z
  .object({
    minLat: coordinate(-90, 90),
    maxLat: coordinate(-90, 90),
    minLng: coordinate(-180, 180),
    maxLng: coordinate(-180, 180),
  })
  .refine((bounds) => bounds.minLat <= bounds.maxLat, {
    message: "Minimum latitude must be less than or equal to maximum latitude",
  })
  .refine((bounds) => bounds.minLng <= bounds.maxLng, {
    message:
      "Minimum longitude must be less than or equal to maximum longitude",
  });

export type NewTodoPayload = z.infer<typeof backendTaskSchema>;
