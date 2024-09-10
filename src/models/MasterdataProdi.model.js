// Library
import { DataTypes } from "sequelize";

class MasterdataProdiModel {
  constructor(server) {
    const table = server.model.db.define('masterdata_prodi', {
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
      fakultas_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'masterdata_fakultas',
          key: 'id'
        }
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
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.literal('CURRENT_TIMESTAMP')
      }
    }, {
      tableName: 'masterdata_prodi',
      timestamps: false
    });

    this.table = table;
  }
}

export default MasterdataProdiModel;