import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  HomepageData,
  OrganizerDetail,
  OrganizerSummary,
  SnapshotManifest,
  TrekComparison,
  TrekSearchEntry,
  TrekSummary,
} from "@/lib/types";
import type { CatalogSnapshotPayload } from "@/lib/catalog/builders";

const SNAPSHOT_ROOT = path.join(process.cwd(), "public", "snapshots");

function resolveSnapshotPath(relativePath: string) {
  return path.join(SNAPSHOT_ROOT, relativePath);
}

async function readJsonFile<T>(relativePath: string): Promise<T | null> {
  try {
    const content = await readFile(resolveSnapshotPath(relativePath), "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeJsonFile(relativePath: string, value: unknown) {
  const filePath = resolveSnapshotPath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readHomepageSnapshot() {
  return readJsonFile<HomepageData>("homepage.json");
}

export async function readTreksIndexSnapshot() {
  return readJsonFile<TrekSummary[]>(path.join("treks", "index.json"));
}

export async function readTrekComparisonSnapshot(slug: string) {
  return readJsonFile<TrekComparison>(path.join("treks", `${slug}.json`));
}

export async function readOrganizerIndexSnapshot() {
  return readJsonFile<OrganizerSummary[]>(path.join("organizers", "index.json"));
}

export async function readOrganizerDetailSnapshot(slug: string) {
  return readJsonFile<OrganizerDetail>(path.join("organizers", `${slug}.json`));
}

export async function readTrekSearchSnapshot() {
  return readJsonFile<TrekSearchEntry[]>(path.join("treks", "search.json"));
}

export async function readSnapshotManifest() {
  return readJsonFile<SnapshotManifest>("manifest.json");
}

export async function writeCatalogSnapshots(payload: CatalogSnapshotPayload) {
  await rm(resolveSnapshotPath("treks"), { force: true, recursive: true });
  await rm(resolveSnapshotPath("organizers"), { force: true, recursive: true });

  await writeJsonFile("homepage.json", payload.homepage);
  await writeJsonFile("manifest.json", payload.manifest);
  await writeJsonFile(path.join("treks", "index.json"), payload.treks);
  await writeJsonFile(path.join("treks", "search.json"), payload.search);
  await writeJsonFile(path.join("organizers", "index.json"), payload.organizers);

  for (const [slug, trek] of Object.entries(payload.trekDetails)) {
    await writeJsonFile(path.join("treks", `${slug}.json`), trek);
  }

  for (const [slug, organizer] of Object.entries(payload.organizerDetails)) {
    await writeJsonFile(path.join("organizers", `${slug}.json`), organizer);
  }
}