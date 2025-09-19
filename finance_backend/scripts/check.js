const { openDb } = require("../db"); // adjust path if needed

async function checkColumns() {
  const db = await openDb();
//  const columns = await db.all("drop table transaction_app");
const columns = await db.all("delete from lent_money");  
  //const columns = await db.all("PRAGMA table_info(transaction_app)");
  console.log(columns);
  await db.close();
}

checkColumns();
