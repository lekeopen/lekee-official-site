import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function normalizeRecord(record) {
  return {
    provider: String(record.provider),
    url: String(record.url),
    acceptedAt: record.acceptedAt ?? null,
    resultClass: String(record.resultClass),
    retryEligible: Boolean(record.retryEligible),
  };
}

export async function loadState(statePath) {
  try {
    const parsed = JSON.parse(await readFile(statePath, 'utf8'));
    return {
      records: Array.isArray(parsed.records) ? parsed.records.map(normalizeRecord) : [],
    };
  } catch (error) {
    if (error?.code === 'ENOENT') return { records: [] };
    throw error;
  }
}

export async function saveState(statePath, records) {
  const directory = path.dirname(statePath);
  const state = { records: records.map(normalizeRecord) };
  const temporaryPath = path.join(directory, `.state-${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, statePath);
}

export async function recordSubmission(statePath, records) {
  const state = await loadState(statePath);
  const merged = new Map(state.records.map((record) => [`${record.provider}\u0000${record.url}`, record]));

  for (const record of records.map(normalizeRecord)) {
    merged.set(`${record.provider}\u0000${record.url}`, record);
  }

  const nextRecords = [...merged.values()].sort((left, right) => (
    left.provider.localeCompare(right.provider) || left.url.localeCompare(right.url)
  ));
  await saveState(statePath, nextRecords);
  return { records: nextRecords };
}

export function acceptedUrls(state, provider) {
  return state.records
    .filter((record) => record.provider === provider && record.resultClass === 'accepted-for-processing')
    .map((record) => record.url);
}
