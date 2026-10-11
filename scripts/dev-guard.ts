/**
 * Shared guard for seed / migrate / checkout harness scripts.
 * Refuses production unless ALLOW_SEED=true is set explicitly.
 */
export function assertScriptAllowed(uri: string, label = 'script'): void {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      `Refusing to run ${label} in production (set ALLOW_SEED=true to override)`
    );
  }
  const dbName = uri.split('/').pop()?.split('?')[0] || '';
  const looksDev = /dev|test|local|admixen|ahmixen|staging/i.test(dbName);
  if (!looksDev && process.env.ALLOW_SEED !== 'true') {
    throw new Error(
      `Database "${dbName}" does not look like a dev database. Set ALLOW_SEED=true to override.`
    );
  }
}
