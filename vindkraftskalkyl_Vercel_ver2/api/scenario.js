/**
 * Vercel Function: spara och hämta kalkylscenario.
 *
 * POST /api/scenario  { falt: { elpris: "0.6", ... } }
 *   → { ok, id?, token, urlNyckel }
 *   id är en kort kod om Upstash Redis är kopplat (UPSTASH_REDIS_REST_URL
 *   + UPSTASH_REDIS_REST_TOKEN). token är alltid en komprimerad, server-
 *   validerad bild av fälten – så delning fungerar även utan databas.
 *
 * GET /api/scenario?id=abc123     (kort kod, kräver Redis)
 * GET /api/scenario?token=...     (komprimerad payload)
 *
 * Ingen beräkningsformel körs här. Vi validerar bara kända fält-id.
 */

import { gzipSync, gunzipSync } from 'node:zlib';
import { TILLATNA_FALT } from '../lib/falt.js';

const TTL_SEKUNDER = 60 * 60 * 24 * 30; // 30 dagar om Redis används
const MAX_TOKEN_TECKEN = 4000;

export async function POST(request) {
  try {
    const kropp = await request.json();
    const falt = rensaFalt(kropp?.falt);
    if (!falt) {
      return jsonFel(400, 'Inga giltiga kalkylfält att spara.');
    }

    const token = packa(falt);
    if (token.length > MAX_TOKEN_TECKEN) {
      return jsonFel(413, 'Scenariot blev för stort att dela som länk.');
    }

    const id = await sparaKortKod(falt);
    return Response.json({
      ok: true,
      id,
      token,
      urlNyckel: id ? 's' : 't',
      ttlDagar: id ? 30 : null
    });
  } catch (err) {
    console.error('scenario POST', err);
    return jsonFel(500, 'Kunde inte spara scenariot. Kalkylen fungerar ändå lokalt.');
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const token = url.searchParams.get('token');

    if (id) {
      const falt = await hamtaKortKod(id);
      if (!falt) {
        return jsonFel(404, 'Kort koden hittades inte (utgången eller Redis saknas).');
      }
      return Response.json({ ok: true, falt, via: 'id' });
    }

    if (token) {
      const falt = packaUpp(token);
      if (!falt) {
        return jsonFel(400, 'Ogiltig delningskod.');
      }
      return Response.json({ ok: true, falt, via: 'token' });
    }

    return jsonFel(400, 'Ange id eller token.');
  } catch (err) {
    console.error('scenario GET', err);
    return jsonFel(500, 'Kunde inte läsa scenariot.');
  }
}

function jsonFel(status, fel) {
  return Response.json({ ok: false, fel }, { status });
}

function rensaFalt(inFalt) {
  if (!inFalt || typeof inFalt !== 'object') return null;
  const ut = {};
  for (const namn of TILLATNA_FALT) {
    if (!Object.prototype.hasOwnProperty.call(inFalt, namn)) continue;
    const v = inFalt[namn];
    if (v === null || v === undefined) continue;
    const text = String(v).trim();
    if (text.length > 40) continue;
    ut[namn] = text;
  }
  return Object.keys(ut).length ? ut : null;
}

function packa(falt) {
  return gzipSync(Buffer.from(JSON.stringify(falt), 'utf8')).toString('base64url');
}

function packaUpp(token) {
  try {
    const json = gunzipSync(Buffer.from(String(token), 'base64url')).toString('utf8');
    return rensaFalt(JSON.parse(json));
  } catch {
    return null;
  }
}

/* Här skedde en uppdatering (2026-09-15): Vercels Upstash-integration
   sätter ofta KV_REST_API_URL / KV_REST_API_TOKEN (gamla Vercel KV-namn).
   Upstash SDK:n faller tillbaka till dem; vi gör samma sak. */
function redisUrl() {
  return process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
}

function redisToken() {
  return process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
}

function redisFinns() {
  return Boolean(redisUrl() && redisToken());
}

async function redisKommando(args) {
  const res = await fetch(redisUrl(), {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + redisToken(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  if (!res.ok) {
    throw new Error('Redis HTTP ' + res.status);
  }
  return res.json();
}

function nyKortKod() {
  const alfabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alfabet[b % alfabet.length]).join('');
}

async function sparaKortKod(falt) {
  if (!redisFinns()) return null;
  try {
    const id = nyKortKod();
    await redisKommando(['SET', 'vk:' + id, JSON.stringify(falt), 'EX', String(TTL_SEKUNDER)]);
    return id;
  } catch (err) {
    console.error('scenario Redis SET', err);
    return null;
  }
}

async function hamtaKortKod(id) {
  if (!/^[a-z0-9]{6}$/i.test(id)) return null;
  if (!redisFinns()) return null;
  try {
    const svar = await redisKommando(['GET', 'vk:' + id.toLowerCase()]);
    if (svar?.result == null) return null;
    return rensaFalt(JSON.parse(svar.result));
  } catch (err) {
    console.error('scenario Redis GET', err);
    return null;
  }
}
