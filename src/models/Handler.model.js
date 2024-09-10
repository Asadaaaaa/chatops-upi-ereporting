// Library
import { Sequelize } from "sequelize";

class HandlerModel {
  constructor(Main) {
    this.Main = Main;
  }

  async connect() {
    this.Main.Logger('Connecting to database...');
    try{
      this.db = new Sequelize({
        host: this.Main.env.DB_HOST,
        port: this.Main.env.DB_PORT,
        username: this.Main.env.DB_USERNAME,
        password: this.Main.env.DB_PASSWORD,
        database: this.Main.env.DB_DATABASE + '_' + this.Main.env.NODE_ENV,
        dialect: this.Main.env.DB_DIALECT,
        logging: this.Main.env.DB_LOGGING === 'true' ? (sql, queryObject) => {
          this.Main.Logger('Query: ' + sql + '\n- Details Object: ' + JSON.stringify({
            model: queryObject.model ? queryObject.model.name : null,
            type: queryObject.type,
            fields: queryObject.fields ? queryObject.fields.join(', ') : null
          }, null, 2));
        } : false
      });

      await this.db.authenticate();
    } catch(err) {
      this.Main.Logger(err);
      return -1;
    }
    
    this.Main.Logger(`Database "${this.db.config.database}" Connected`);

    return this.db;
  }
}

export default HandlerModel;