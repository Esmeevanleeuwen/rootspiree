import { stdin, stderr, stdout } from "node:process";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { openDatabase, provisionAdmin } from "./accounts.js";

function prompt(label, hidden = false) {
  const output = hidden
    ? new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      })
    : stderr;
  const readline = createInterface({ input: stdin, output, terminal: true });
  stderr.write(label);

  return new Promise((resolve, reject) => {
    const cancel = () => reject(new Error("Admin setup cancelled."));
    readline.once("close", cancel);
    readline.once("SIGINT", () => readline.close());
    readline.question("", (value) => {
      readline.removeListener("close", cancel);
      readline.close();
      resolve(value);
    });
  }).finally(() => {
    if (hidden) stderr.write("\n");
  });
}

async function main() {
  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    if (!stdin.isTTY)
      throw new Error(
        "Set ADMIN_EMAIL and ADMIN_PASSWORD before running this command.",
      );
    email ||= await prompt("Admin email: ");
    if (!password) {
      password = await prompt("Admin password (12–128 characters): ", true);
      const confirmation = await prompt("Repeat admin password: ", true);
      if (password !== confirmation)
        throw new Error("The passwords do not match.");
    }
  }

  const db = openDatabase();
  try {
    const result = await provisionAdmin(db, {
      email,
      password,
      name: process.env.ADMIN_NAME || undefined,
    });
    stdout.write(
      result === "created"
        ? "Admin account created. Sign in using its email and password.\n"
        : "Admin credentials updated. Previous admin sessions were signed out.\n",
    );
  } finally {
    db.close();
  }
}

const messages = {
  email_in_use:
    "This email belongs to a player. Choose a different admin email.",
  invalid_email: "Enter a valid email address for the admin.",
  invalid_name: "Use an admin name of 1–80 characters.",
  invalid_password: "Use an admin password of 12–128 characters.",
};

main().catch((error) => {
  stderr.write((messages[error.code] || error.message) + "\n");
  process.exitCode = 1;
});
