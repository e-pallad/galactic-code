import { z } from "zod"

/** A user-supplied link: http(s) only, so `javascript:` and friends never reach an href. */
export const httpUrl = z
  .string()
  .max(2048)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Only http(s) URLs are allowed")
