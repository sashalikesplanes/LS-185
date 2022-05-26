// import Client from "node-postgres";
const { Client } = require("pg");

config = {
  database: "films",
  host: "/tmp",
  user: "sasha",
  port: 5432,
};

async function logQuery(queryText) {
  const client = new Client(config);
  await client.connect();

  let data = await client.query(queryText);

  console.log(data.rows[2].count);

  await client.end();
}

logQuery(`SELECT count(id) FROM films
WHERE duration < 110
GROUP BY genre;`);
