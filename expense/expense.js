#!/usr/bin/env node

const { Client } = require("pg");
const { argv, exit } = require("node:process");

db_config = {
  database: "expense",
  host: "/tmp",
  user: "sasha",
  port: 5432,
};

class CLI {
  constructor() {
    this.expenseData = new ExpenseData(db_config);
  }
  main(argv) {
    if (argv[2] === "list") {
      this.expenseData.printAllExpenses();
    } else if (argv[2] === "add") {
      this.expenseData.addExpense(argv[3], argv[4]);
    } else if (argv[2] === "clear") {
      console.log("deleting all expenses");
    } else if (argv[2] === "search") {
      const searchTerm = argv.slice(3).join(" "); // allow for search of multiple words
      this.expenseData.printSearchedExpense(searchTerm);
    } else if (argv[2] === "delete") {
      this.expenseData.deleteExpense(argv[3]);
    } else {
      this.printHelp();
    }
  }
  printHelp() {
    console.log(`
  An expense recording system
  
  Commands:
  
  add AMOUNT MEMO [DATE] - record a new expense
  clear - delete all expenses
  list - list all expenses
  delete NUMBER - remove expense with id NUMBER
  search QUERY - list expenses with a matching memo field`);
  }
}

class ExpenseData {
  constructor(config) {
    this.config = config;
    this.client = new Client(config);
  }

  async printAllExpenses() {
    await this.client.connect().catch(this.logAndExit);

    const expenses = (
      await this.client
        .query("SELECT * FROM expenses ORDER BY created_on ASC;")
        .catch(this.logAndExit)
    ).rows;

    this.client.end().catch(this.logAndExit);
    this.printExpenses(expenses);
  }

  printExpenses(expenses) {
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

  async printSearchedExpense(searchTerm) {
    const queryText = `SELECT * FROM expenses WHERE memo ILIKE '%' || $1 || '%';`;
    const queryArgs = [searchTerm];

    await this.client.connect().catch(this.logAndExit);
    const expenses = (
      await this.client.query(queryText, queryArgs).catch(this.logAndExit)
    ).rows;

    this.client.end();
    this.printExpenses(expenses);
  }

  async addExpense(amount, memo) {
    // TODO validate inputs
    if (amount === undefined || memo === undefined) {
      console.log("You must provide an amount and a memo");
      return;
    }

    const queryText = `INSERT INTO expenses(amount, memo, created_on) VALUES ($1, $2, NOW());`;
    const queryArgs = [amount, memo];

    await this.client.connect().catch(this.logAndExit);
    await this.client.query(queryText, queryArgs).catch(this.logAndExit);

    this.client.end().catch(this.logAndExit);
  }

  async deleteExpense(expenseId) {
    // SELECT ID to check for existence and to inform user of which was deleted
    const queryTextSelect = `SELECT * FROM expenses WHERE id=$1`;
    const queryTextDelete = `DELETE FROM expenses WHERE id=$1`;
    const queryArgs = [expenseId];

    await this.client.connect().catch(this.logAndExit);
    const expenses = (
      await this.client.query(queryTextSelect, queryArgs).catch(this.logAndExit)
    ).rows;

    if (expenses.length === 0) {
      console.log(`There is no expenses with id '${expenseId}'.`);
    } else {
      this.printExpenses(expenses);
      await this.client
        .query(queryTextDelete, queryArgs)
        .catch(this.logAndExit);
    }

    this.client.end().catch(this.logAndExit);
  }

  logAndExit(error) {
    console.log(`Error expense.js | ${error}`);
    exit(1);
  }
}

const cli = new CLI();
cli.main(argv);
