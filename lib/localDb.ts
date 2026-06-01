import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type { Physicist } from "@/lib/types";

export type LocalPhysicist = Physicist & { edit_code_hash: string };

const dbPath = join(process.cwd(), "data", "physicists.local.json");

async function readProfiles(): Promise<LocalPhysicist[]> {
  try {
    const content = await readFile(dbPath, "utf8");
    return JSON.parse(content) as LocalPhysicist[];
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: LocalPhysicist[]) {
  await mkdir(dirname(dbPath), { recursive: true });
  await writeFile(dbPath, `${JSON.stringify(profiles, null, 2)}\n`);
}

export async function listLocalProfiles() {
  return readProfiles();
}

export async function createLocalProfile(
  profile: Omit<LocalPhysicist, "id" | "created_at" | "updated_at">
) {
  const profiles = await readProfiles();
  const now = new Date().toISOString();
  const nextProfile: LocalPhysicist = {
    ...profile,
    id: randomUUID(),
    created_at: now,
    updated_at: now
  };

  profiles.push(nextProfile);
  await writeProfiles(profiles);

  return nextProfile;
}

export async function updateLocalProfile(id: string, changes: Partial<LocalPhysicist>) {
  const profiles = await readProfiles();
  const index = profiles.findIndex((profile) => profile.id === id);
  if (index === -1) {
    return null;
  }

  profiles[index] = {
    ...profiles[index],
    ...changes,
    updated_at: new Date().toISOString()
  };
  await writeProfiles(profiles);

  return profiles[index];
}

export async function deleteLocalProfile(id: string) {
  const profiles = await readProfiles();
  const nextProfiles = profiles.filter((profile) => profile.id !== id);
  await writeProfiles(nextProfiles);
  return nextProfiles.length !== profiles.length;
}
