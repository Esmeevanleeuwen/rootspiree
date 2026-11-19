const sqliteTransactions = new WeakMap();

export async function withTransaction(db, write, task) {
  if (db.transaction) return db.transaction({ write }, task);

  const result = (sqliteTransactions.get(db) ?? Promise.resolve()).then(
    async () => {
      db.exec(write ? "BEGIN IMMEDIATE" : "BEGIN");
      try {
        const value = await task(db);
        db.exec("COMMIT");
        return value;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  );
  sqliteTransactions.set(
    db,
    result.catch(() => {}),
  );
  return result;
}
