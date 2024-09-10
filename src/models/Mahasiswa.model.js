// Library
import { DataTypes } from "sequelize";

class MahasiswaModel {
  constructor(server) {
    const table = server.model.db.define('mahasiswa', {
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
      prodi_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'masterdata_prodi',
          key: 'id'
        }
      },
      nim: {
        type: DataTypes.STRING(20),
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
      tableName: 'mahasiswa',
      timestamps: false
    });

    this.table = table;
  }
}

export default MahasiswaModel;