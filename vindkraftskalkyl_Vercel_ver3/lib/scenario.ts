/**
 * Dela en kalkyl som länk – två sätt, samma innehåll.
 *
 * `?s=abc123` : kort kod som pekar på ett värde i Redis (`vk:abc123`, 30 dagar).
 * `?t=…`      : hela fältbilden gzippad och base64url-kodad i adressen. Ingen
 *               databas behövs, ingen tidsgräns i koden – men längre URL.
 *
 * Bara de gula indatafälten delas. LCOE, NPV och övriga nyckeltal räknas om
 * när länken öppnas, så en delad länk kan aldrig visa gamla resultat till nya
 * indata. Ingen formel bor här.
 *
 * Porten från ver2:s `api/scenario.js` behåller format och alfabet, så koder
 * som skapats i ver2 går att läsa här och tvärtom.
 *
 * Server-modul: `node:zlib` finns inte i webbläsaren. Importera den aldrig
 * från en klientkomponent.
 */

import { gzipSync, gunzipSync } from 'node:zlib';
import { rensaFalt, type Falt } from './falt.ts';
import { redisFinns, redisGet, redisSet } from './redis.ts';

/** Livslängd för korta koder. Samma 30 dagar som i ver2. */
export const TTL_DAGAR = 30;
const TTL_SEKUNDER = 60 * 60 * 24 * TTL_DAGAR;

/** Längre token än så blir opraktiskt att klistra in i ett mejl. */
export const MAX_TOKEN_TECKEN = 4000;

/** Alfabet utan i, l, o, 0 och 1 – tecken som lätt blandas ihop. */
const ALFABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Packar fälten till en lång delningstoken (`?t=`). */
export function packa(falt: Falt): string {
  return gzipSync(Buffer.from(JSON.stringify(falt), 'utf8')).toString(
    'base64url'
  );
}

/** Packar upp en token. Returnerar null om den är trasig eller manipulerad. */
export function packaUpp(token: string): Falt | null {
  try {
    const json = gunzipSync(Buffer.from(String(token), 'base64url')).toString(
      'utf8'
    );
    return rensaFalt(JSON.parse(json));
  } catch {
    return null;
  }
}

function nyKortKod(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => ALFABET[b % ALFABET.length]).join('');
}

/**
 * Sparar fälten under en kort kod. Utan Redis returneras null – anroparen
 * får då nöja sig med den långa token, i stället för att anropet misslyckas.
 */
export async function sparaKortKod(falt: Falt): Promise<string | null> {
  if (!redisFinns()) return null;
  const id = nyKortKod();
  const gick = await redisSet(`vk:${id}`, JSON.stringify(falt), TTL_SEKUNDER);
  return gick ? id : null;
}

/** Hämtar fälten bakom en kort kod. Null om koden är okänd eller utgången. */
export async function hamtaKortKod(id: string): Promise<Falt | null> {
  if (!/^[a-z0-9]{6}$/i.test(id)) return null;
  const varde = await redisGet(`vk:${id.toLowerCase()}`);
  if (!varde) return null;
  try {
    return rensaFalt(JSON.parse(varde));
  } catch {
    return null;
  }
}
