import { runScrapers } from "./core/runner";
import { registeredScrapers } from "./registry";

function getOption(name: string) {
  const prefix = `--${name}=`;
  const value = process.argv.find((argument) => argument.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const organizer = getOption("organizer");
  const limit = Number(getOption("limit"));
  const results = await runScrapers(registeredScrapers, {
    dryRun,
    organizer,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
  });

  if (registeredScrapers.length === 0) {
    console.log(
      "No scrapers are registered yet. Add an organizer adapter to src/scrapers/registry.ts when you are ready.",
    );
    return;
  }

  console.table(
    results.map((result) => ({
      organizer: result.organizerSlug,
      status: result.status,
      dryRun: result.dryRun,
      packagesFound: result.packagesFound,
      packagesUpserted: result.packagesUpserted,
      durationMs: result.durationMs,
      error: result.error ?? "",
    })),
  );

  if (results.some((result) => result.status === "failed")) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});