/**
 * Minimal Redis-klient mot Upstash REST-API.
 *
 * Två användningar i appen: cache för hämtade elpriser (`elpris:…`, 6 timmar)
 * och korta delningskoder (`vk:…`, 30 dagar, byggs i nästa steg).
 *
 * Samma miljövariabler och samma fallback som i ver2: Upstash-namnen först,
 * därefter Vercels KV-namn. Saknas de helt ska ingenting krascha – anroparen
 * får `null` respektive `false` och kan jobba vidare utan cache.
 *
 * Inget extra paket behövs: Upstash REST tar ett vanligt fetch-anrop där
 * kommandot skickas som en JSON-array, t.ex. ["SET", nyckel, värde, "EX", 3600].
 */

type RedisKoppling = { url: string; token: string };

function koppling(): RedisKoppling | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? '';
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? '';
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

/** Sant om appen har en Redis att prata med. Styr om `?s=` kan erbjudas. */
export function redisFinns(): boolean {
  return koppling() !== null;
}

async function kor(kommando: (string | number)[]): Promise<unknown> {
  const anslutning = koppling();
  if (!anslutning) return null;

  const svar = await fetch(anslutning.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${anslutning.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(kommando),
    cache: 'no-store',
  });

  if (!svar.ok) {
    console.error('redis: HTTP', svar.status, kommando[0]);
    return null;
  }

  const data = (await svar.json()) as { result?: unknown };
  return data?.result ?? null;
}

/** Läser en sträng. Returnerar null vid miss, saknad Redis eller fel. */
export async function redisGet(nyckel: string): Promise<string | null> {
  try {
    const resultat = await kor(['GET', nyckel]);
    return typeof resultat === 'string' ? resultat : null;
  } catch (fel) {
    console.error('redis: GET misslyckades', fel);
    return null;
  }
}

/** Skriver en sträng med livslängd i sekunder. Returnerar om det gick. */
export async function redisSet(
  nyckel: string,
  varde: string,
  ttlSekunder: number
): Promise<boolean> {
  try {
    const resultat = await kor(['SET', nyckel, varde, 'EX', ttlSekunder]);
    return resultat === 'OK';
  } catch (fel) {
    console.error('redis: SET misslyckades', fel);
    return false;
  }
}
