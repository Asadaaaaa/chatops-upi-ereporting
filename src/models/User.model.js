// Library
import { DataTypes } from "sequelize";

class UsersModel {
  constructor(Main) {
    const table = Main.model.db.define('users', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: Main.model.db.literal('gen_random_uuid()')
      },
      username: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      chat_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      state: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{"state":"","data":{}}'
      },
      join_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Main.model.db.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Main.model.db.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Main.model.db.literal('CURRENT_TIMESTAMP')
      }
    }, {
      tableName: 'users',
      timestamps: false
    });

    this.table = table;
  }
}

export default UsersModel;