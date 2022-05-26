#!/usr/bin/env node

const { Client } = require("pg");
const { argv } = require("node:process");

config = {
  database: "expense",
  host: "/tmp",
  user: "sasha",
  port: 5432,
};

async function getAllExpenses() {
  const client = new Client(config);
  await client.connect();

  const expenses = (
    await client.query("SELECT * FROM expenses ORDER BY created_on ASC;")
  ).rows;

  client.end();

  return await expenses;
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
  if (amount === undefined || memo === undefined) {
    console.log("You must provide an amount and a memo");
    return;
  }

  const client = new Client(config);
  await client.connect();

  try {
    await client.query(
      `INSERT INTO expenses(amount, memo, created_on) VALUES (${amount}, '${memo}', NOW());`
    );
  } catch (e) {
    console.log(`Error: ${e}`);
  }
  client.end();
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
