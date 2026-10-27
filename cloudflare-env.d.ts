declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    AI_VAULT_SECRET?: string;
    SESSION_SECRET?: string;
  }
}
