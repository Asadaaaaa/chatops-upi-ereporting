// Library
import { DataTypes } from "sequelize";

class MasterdataFakultasModel {
  constructor(server) {
    const table = server.model.db.define('masterdata_fakultas', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: server.model.db.literal('gen_random_uuid()')
      },
      kode: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      nama: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: server.model.db.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: server.model.db.literal('CURRENT_TIMESTAMP')
      }
    }, {
      tableName: 'masterdata_fakultas',
      timestamps: false
    });

    this.table = table;
  }
}

export default MasterdataFakultasModel;