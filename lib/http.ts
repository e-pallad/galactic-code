/**
 * Request body as JSON, or `undefined` when it isn't valid JSON. Routes feed the
 * result to their zod schema, so a malformed body ends up as a 400 "Invalid
 * input" like any other bad payload instead of an unhandled 500.
 */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return (await req.json()) as unknown
  } catch {
    return undefined
  }
}
