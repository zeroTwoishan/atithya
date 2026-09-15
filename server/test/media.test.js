/** WhatsApp media download (src/media.js), with fetch stubbed — the two-step
 *  Graph API dance is the part that is easy to get wrong and impossible to
 *  notice until a host sends a photo on stage. */
import { test, beforeEach, afterEach, after } from "node:test";
import assert from "node:assert/strict";
import { rm, readdir } from "node:fs/promises";

import { fetchMedia, fetchAllMedia, MEDIA_DIR } from "../src/media.js";

const realFetch = globalThis.fetch;
let calls;

beforeEach(() => {
  calls = [];
  process.env.WHATSAPP_ACCESS_TOKEN = "test-token";
  process.env.PUBLIC_BASE_URL = "http://localhost:8000";
});

afterEach(() => {
  globalThis.fetch = realFetch;
});

after(async () => {
  await rm(MEDIA_DIR, { recursive: true, force: true });
});

/** Stubs both legs: GET /<id> returns metadata, GET <url> returns bytes. */
function stubGraph({ mime = "image/jpeg", size = 2048, lookupStatus = 200, downloadStatus = 200 } = {}) {
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), auth: options?.headers?.Authorization });
    if (String(url).includes("/media-download/")) {
      return {
        ok: downloadStatus === 200,
        status: downloadStatus,
        arrayBuffer: async () => new Uint8Array(size).buffer,
      };
    }
    return {
      ok: lookupStatus === 200,
      status: lookupStatus,
      json: async () => ({
        url: "https://lookaside.fbsbx.com/media-download/abc",
        mime_type: mime,
        file_size: size,
      }),
    };
  };
}

test("resolves an id through both calls and returns a servable URL", async () => {
  stubGraph();
  const url = await fetchMedia("media-123");

  assert.match(url, /^http:\/\/localhost:8000\/media\/[0-9a-f-]{36}\.jpg$/);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /graph\.facebook\.com\/v21\.0\/media-123$/);
  // The download leg needs the same Bearer token — without it Meta 401s.
  assert.equal(calls[1].auth, "Bearer test-token");

  const saved = await readdir(MEDIA_DIR);
  assert.equal(saved.length, 1);
});

test("the filename is never the media id — those are guessable and served unauthenticated", async () => {
  stubGraph();
  const url = await fetchMedia("media-123");
  assert.ok(!url.includes("media-123"));
});

test("maps the mime type to a real extension", async () => {
  stubGraph({ mime: "image/png" });
  assert.match(await fetchMedia("m1"), /\.png$/);
  stubGraph({ mime: "application/octet-stream" });
  assert.match(await fetchMedia("m2"), /\.bin$/);
});

test("a failure anywhere returns null instead of throwing", async () => {
  stubGraph({ lookupStatus: 404 });
  assert.equal(await fetchMedia("gone"), null);

  stubGraph({ downloadStatus: 401 });
  assert.equal(await fetchMedia("expired"), null);

  globalThis.fetch = async () => {
    throw new Error("network down");
  };
  assert.equal(await fetchMedia("offline"), null);
});

test("refuses a file over the size limit before downloading it", async () => {
  stubGraph({ size: 50 * 1024 * 1024 });
  assert.equal(await fetchMedia("huge"), null);
  assert.equal(calls.length, 1, "should not have fetched the bytes");
});

test("with no access token configured it skips rather than failing", async () => {
  delete process.env.WHATSAPP_ACCESS_TOKEN;
  globalThis.fetch = async () => assert.fail("must not call Meta without a token");
  assert.equal(await fetchMedia("m1"), null);
});

test("fetchAllMedia keeps what worked and drops what didn't", async () => {
  let call = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/media-download/")) {
      return { ok: true, status: 200, arrayBuffer: async () => new Uint8Array(64).buffer };
    }
    call += 1;
    // Second id is a dud.
    if (call === 2) return { ok: false, status: 404, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      json: async () => ({ url: "https://lookaside.fbsbx.com/media-download/x", mime_type: "image/jpeg", file_size: 64 }),
    };
  };

  const urls = await fetchAllMedia(["a", "b", "c"]);
  assert.equal(urls.length, 2);
  for (const url of urls) assert.match(url, /\/media\//);
});

test("no ids means no calls", async () => {
  globalThis.fetch = async () => assert.fail("should not fetch");
  assert.deepEqual(await fetchAllMedia([]), []);
});
