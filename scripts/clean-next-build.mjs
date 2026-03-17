import { promises as fs } from "node:fs";
import path from "node:path";

const CACHE_PREFIX = "alaska-policy-microsite-next-";

async function removeIfExists(targetPath) {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function main() {
  const cwd = process.cwd();
  const cacheDir = path.join(path.dirname(cwd), ".build-artifacts-cache");
  const nextDir = path.join(cwd, ".next");

  await fs.mkdir(cacheDir, { recursive: true });

  try {
    await fs.access(nextDir);
    await fs.rename(nextDir, path.join(cacheDir, `${CACHE_PREFIX}${Date.now()}`));
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  const cacheEntries = await fs.readdir(cacheDir, { withFileTypes: true });
  const generatedPaths = cacheEntries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(CACHE_PREFIX))
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, -3)
    .map((entry) => path.join(cacheDir, entry.name));

  await Promise.all(generatedPaths.map(removeIfExists));
}

await main();
