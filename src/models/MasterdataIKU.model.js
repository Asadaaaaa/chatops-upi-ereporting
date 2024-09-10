// Library
import { DataTypes } from "sequelize";

class MasterdataIKUModel {
  constructor(Main) {
    const table = Main.model.db.define('masterdata_iku', {
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
      nomor: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      nama: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      data: {
        type: DataTypes.JSON,
        allowNull: false
      },
      additional_data: {
        type: DataTypes.JSON,
        allowNull: true
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
      tableName: 'masterdata_iku',
      timestamps: false
    });

    this.table = table;
  }
}

export default MasterdataIKUModel;