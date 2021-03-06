'use strict';

const BaseDatabase = require("../shared/baseDatabase");

/**
 * Responsible for database operations for the Talk Domain
 */
class TalkDatabase extends BaseDatabase {
  /**
   * Initialize an instance of the TalkDatabase
   * @constructor
   * @param {IoC} opts - IoC object holding dependencies
   */
  constructor(opts) {
    super(opts);
    this.tableName = 'Talks';
  }

  // async ensureTableExists() {
  //   const sql = `CREATE TABLE IF NOT EXISTS ${this.tableName} (
  //     topic_id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 32767 CACHE 1 ),
  //     title character varying(100) COLLATE pg_catalog."default" NOT NULL,
  //     tag character varying(100) COLLATE pg_catalog."default" NOT NULL,
  //     talks_url character varying(200) COLLATE pg_catalog."default"
  //   )`
  //   await super.query(sql);
  // }
}

module.exports = TalkDatabase;
