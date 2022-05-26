#!/usr/bin/env node

const { Client } = require("pg");
const { argv, exit } = require("node:process");

config = {
  database: "expense",
  host: "/tmp",
  user: "sasha",
  port: 5432,
};

function logAndExit(error) {
  console.log(`Error expense.js | ${error}`);
  exit(1);
}

async function getAllExpenses() {
  const client = new Client(config);
  try {
    await client.connect();

    const expenses = (
      await client.query("SELECT * FROM expenses ORDER BY created_on ASC;")
    ).rows;

    client.end();

    return await expenses;
  } catch (e) {
    client.end();
    logAndExit(e);
  }
}

async function printAllExpenses() {
  const expenses = await getAllExpenses();

  expenses.forEach((expense) => {
    const textColumns = [
      String(expense.id),
      expense.created_on.toDateString(),
      String(expense.amount).padStart(15, " "),
      String(expense.memo),
    ];

    console.log(textColumns.join(" | "));
  });
}

async function addExpense(amount, memo) {
  // TODO validate inputs
  if (amount === undefined || memo === undefined) {
    console.log("You must provide an amount and a memo");
    return;
  }

  query = `INSERT INTO expenses(amount, memo, created_on) VALUES ($1, $2, NOW());`;

  const client = new Client(config);
  try {
    await client.connect();
    await client.query(query, [amount, memo]);
  } catch (e) {
    logAndExit(e);
  } finally {
    client.end();
  }
}

function printHelp() {
  console.log(`
An expense recording system

Commands:

add AMOUNT MEMO [DATE] - record a new expense
clear - delete all expenses
list - list all expenses
delete NUMBER - remove expense with id NUMBER
search QUERY - list expenses with a matching memo field`);
}

// MAIN
if (argv[2] === "list") printAllExpenses(getAllExpenses());
else if (argv[2] === "add") addExpense(argv[3], argv[4]);
else if (argv[2] === "clear") console.log("deleting all expenses");
else printHelp();
