// Library
import { DataTypes } from "sequelize";

class DataIKUModel {
  constructor(server) {
    const table = server.model.db.define('data_iku', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: DataTypes.literal('gen_random_uuid()')
      },
      masterdata_iku_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'masterdata_iku',
          key: 'id'
        }
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP')
      }
    }, {
      tableName: 'data_iku',
      timestamps: false
    });

    this.table = table;
  }
}

export default DataIKUModel;