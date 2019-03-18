require('dotenv').config()
const { Database, aql } = require('arangojs')

const host = process.env.ARANGODB_HOST
const port = process.env.ARANGODB_PORT
const database = process.env.ARANGODB_DB
const dbUsername = process.env.ARANGODB_USERNAME
const dbPassword = process.env.ARANGODB_PASSWORD

const testDb = async () => {
  try {
    const arango = new Database({
      url: `http://${dbUsername}:${dbPassword}@${host}:${port}`
    });

    //console.log('test db')
    let dbnames = await arango.listDatabases();
    if (dbnames.indexOf(database) == -1) {
      await arango.createDatabase(database).then(() => {
        console.log("Database created successfully: ", db);
      });
    }
    arango.useDatabase(database);
    return arango;
  } catch (err) { console.log(err) }//{info(err)}	
}

const testCol = async (db, coll) => {
  try {
    let collnames = await db.collections(true);
    let names = collnames.map(collname => {
      let name = collname.name;
      return name;
    });
    let collready = db.collection(coll);
    if (names.indexOf(coll) == -1) {
      await collready.create();
    }
  } catch (err) {
    console.log(err);
  }
};


const testing = async (collname) => {
  try {
    let dbready = await testDb();
    await testCol(dbready, collname);
    return dbready;
  } catch (err) {
    console.log(err);
  }
};

const upsert = async (collname, doc) => {
  try {
    let dbready = await testing(collname);
    let cursor = await dbready.query({
      query:
        "UPSERT { _key : @_key } INSERT @doc UPDATE @doc IN @@collname RETURN { OLD, NEW }",
      bindVars: {
        "@collname": collname,
        _key: doc._key,
        doc: doc
      }
    });
    let result = await cursor.all();
    return result[0];
  } catch (err) {
    console.log(doc)
    console.log(err);
  }
};

const query = async aq => {
  try {
    //console.log('start')
    let dbready = await testDb();
    let cursor = await dbready.query(aq);
    let res = await cursor.all();
    //console.log('res:', res.length)

    //info(cursor._result);
    return res;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  aql,
  query,
  upsert,
};