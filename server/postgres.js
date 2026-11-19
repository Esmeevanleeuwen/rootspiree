import pg from "pg";

// Reserve a stable advisory lock for writes to the LevelUp World schema.
const lockWorld = "SELECT pg_advisory_xact_lock(1281717861, 1817546839)";

function prepared(execute) {
  return (sql) => {
    // Statements come from the app and pass all values separately. Preserve
    // question marks inside quoted SQL strings and identifiers.
    let parameter = 0;
    const text = sql.replace(/'(?:[^']|'')*'|"(?:[^"]|"")*"|\?/g, (token) =>
      token === "?" ? "$" + ++parameter : token,
    );
    return {
      async get(...values) {
        return (await execute(text, values)).rows[0];
      },
      async all(...values) {
        return (await execute(text, values)).rows;
      },
      async run(...values) {
        return { changes: (await execute(text, values)).rowCount };
      },
    };
  };
}

export function openPostgres(connectionString, { ca } = {}) {
  const url = URL.parse(connectionString);
  if (
    !url?.hostname ||
    !url.username ||
    url.pathname.length <= 1 ||
    !["postgres:", "postgresql:"].includes(url.protocol)
  ) {
    throw new Error("The database URL must be a PostgreSQL connection string");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const local = ["localhost", "127.0.0.1", "::1"].includes(host);
  // Use explicit connection fields so sslmode and other URL options cannot
  // override the verified TLS configuration for managed databases.
  const pool = new pg.Pool({
    host,
    port: Number(url.port || 5432),
    database: decodeURIComponent(url.pathname.slice(1)),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: local ? false : { rejectUnauthorized: true, ...(ca && { ca }) },
    max: 4,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
  pool.on("error", (error) => {
    console.error("Game database connection closed:", error.code || error.name);
  });

  async function withConnection({ write }, callback) {
    const client = await pool.connect();
    let discard = false;
    try {
      const begin = write
        ? "BEGIN"
        : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY";
      // Transaction poolers may switch the backend connection after COMMIT.
      await client.query(
        [
          begin,
          "SET LOCAL search_path TO pg_catalog, levelup, pg_temp",
          "SET LOCAL statement_timeout TO '8s'",
          ...(write ? [lockWorld] : []),
        ].join("; "),
      );
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        discard = true;
      }
      throw error;
    } finally {
      client.release(discard);
    }
  }

  return {
    prepare: prepared((sql, values) =>
      withConnection({ write: !/^\s*SELECT\b/i.test(sql) }, (client) =>
        client.query(sql, values),
      ),
    ),
    transaction(options, callback) {
      return withConnection(options, (client) =>
        callback({
          prepare: prepared((sql, values) => client.query(sql, values)),
        }),
      );
    },
    close: () => pool.end(),
  };
}
