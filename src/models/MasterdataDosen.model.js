// Library
import { DataTypes } from "sequelize";

class MasterdataDosenModel {
  constructor(Main) {
    const table = Main.model.db.define('masterdata_dosen', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: Main.model.db.literal(`gen_random_uuid()`)
      },
      prodi_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'masterdata_prodi',
          key: 'id'
        },
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
      },
      nip: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      nama: {
        type: DataTypes.STRING(60),
        allowNull: false
      },
      is_notify: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
      },
    }, {
      tableName: 'masterdata_dosen',
      timestamps: false
    });

    this.table = table;
  }
}

export default MasterdataDosenModel;