/** The response envelope from docs/TRD.md §4: { data, meta? } / { error }. */

export const ok = (res, data, meta) => res.json(meta ? { data, meta } : { data });

export const created = (res, data) => res.status(201).json({ data });

export const fail = (res, status, code, message, details) =>
  res.status(status).json({ error: details ? { code, message, details } : { code, message } });

/** Wraps an async route so a rejected promise reaches the error handler
 *  instead of hanging the request. Express 5 forwards rejections on its own,
 *  but being explicit keeps it obvious which handlers are async. */
export const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

/** Validates req.body against a zod schema, 422 with field details on failure
 *  (docs/TRD.md §6 — reject malformed payloads, never leak a stack trace). */
export function parseBody(schema, req, res) {
  const result = schema.safeParse(req.body);
  if (result.success) return result.data;
  fail(res, 422, "validation_error", "Request body failed validation.", result.error.issues);
  return null;
}
