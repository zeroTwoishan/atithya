/** WhatsApp Cloud API media (docs/TRD.md §3.1).
 *
 *  A media id is not a URL. Fetching a photo a host sent takes two
 *  authenticated calls — GET /<id> for a short-lived download URL, then GET
 *  that URL for the bytes — and the second one 401s without the same Bearer
 *  token, so the id can never be handed to a browser as-is.
 *
 *  Downloaded files land in `server/media/` and are served at `/media/<file>`
 *  by src/app.js. ponytail: the local disk is the object store. Swap
 *  `save()` for an S3/Cloudinary put if the demo ever runs on more than one
 *  machine — nothing else here changes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const GRAPH_API = "https://graph.facebook.com/v21.0";
const MAX_BYTES = 8 * 1024 * 1024; // a WhatsApp image is ~100KB-5MB
const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "application/pdf": "pdf",
};

export const MEDIA_DIR = new URL("../media/", import.meta.url);

const publicBase = () => (process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 8000}`).replace(/\/$/, "");

/** Downloads one media id. Returns its public URL, or null — a photo is never
 *  worth failing an onboarding over. */
export async function fetchMedia(id) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.log(`[media] no WHATSAPP_ACCESS_TOKEN — skipping media ${id}`);
    return null;
  }
  const auth = { Authorization: `Bearer ${token}` };

  try {
    // Step 1: id -> { url, mime_type, file_size }. That url expires in ~5min.
    const lookup = await fetch(`${GRAPH_API}/${id}`, { headers: auth });
    if (!lookup.ok) throw new Error(`lookup ${lookup.status}`);
    const meta = await lookup.json();

    if (meta.file_size && Number(meta.file_size) > MAX_BYTES) {
      throw new Error(`${meta.file_size} bytes exceeds the ${MAX_BYTES} limit`);
    }

    // Step 2: the bytes — same Bearer token, or Meta returns 401.
    const download = await fetch(meta.url, { headers: auth });
    if (!download.ok) throw new Error(`download ${download.status}`);
    const bytes = Buffer.from(await download.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new Error(`${bytes.byteLength} bytes exceeds the limit`);

    const extension = EXTENSIONS[meta.mime_type] ?? "bin";
    // Random name, never the id: media ids are guessable across a business
    // account, and these files are served unauthenticated.
    const filename = `${randomUUID()}.${extension}`;
    await save(filename, bytes);
    return `${publicBase()}/media/${filename}`;
  } catch (error) {
    console.error(`[media] ${id} failed:`, error.message);
    return null;
  }
}

/** Resolves every id a conversation collected, in parallel, dropping failures. */
export async function fetchAllMedia(ids = []) {
  const urls = await Promise.all(ids.map((id) => fetchMedia(id)));
  return urls.filter(Boolean);
}

async function save(filename, bytes) {
  await mkdir(MEDIA_DIR, { recursive: true });
  await writeFile(new URL(filename, MEDIA_DIR), bytes);
}
