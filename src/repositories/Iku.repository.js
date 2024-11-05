import UserModel from "../models/User.model.js";
import MahasiswaModel from "../models/Mahasiswa.model.js";
import MasterdataDosenModel from "../models/MasterdataDosen.model.js";
import MasterdataIKUModel from "../models/MasterdataIKU.model.js";
import MasterdataFakultasModel from "../models/MasterdataFakultas.model.js";
import MasterdataProdiModel from "../models/MasterdataProdi.model.js";
import DataIKUModel from "../models/DataIKU.model.js";
import UserService from "./User.repository.js";
import {getLabelField, setupForm} from "../helpers/FormSetup.helper.js";
import MasterdataNegaraModel from "../models/MasterdataNegara.model.js";
import {Op, QueryTypes} from "sequelize";

class IkuRepository {
  constructor(Main) {
    this.Main = Main;
    this.UserModel = new UserModel(this.Main).table;
    this.UserService = new UserService(Main);
    this.MasterdataDosenModel = new MasterdataDosenModel(this.Main).table;
    this.MasterdataIkuModel = new MasterdataIKUModel(this.Main).table;
    this.MahasiswaModel = new MahasiswaModel(this.Main).table;
    this.MasterdataFakultasModel = new MasterdataFakultasModel(this.Main).table;
    this.MasterdataProdiModel = new MasterdataProdiModel(this.Main).table;
    this.MasterdataNegaraModel = new MasterdataNegaraModel(this.Main).table;
    this.DataIkuModel = new DataIKUModel(this.Main).table;
  }

  async getIkuData (iku_number) {
    return await this.MasterdataIkuModel.findOne({
      where: {
        nomor: iku_number
      }
    });
  }

  async getProgramStudiOptions() {
    return await this.MasterdataProdiModel.findAll({
      attributes: ['kode', 'nama']
    });
  }

  async getFakultasOptions() {
    return await this.MasterdataFakultasModel.findAll({
      attributes: ['kode', 'nama']
    });
  }

  async getProdiByUsername(username) {
    const dosen = await this.UserService.checkUserDosen(username);

    const prodi = await this.MasterdataProdiModel.findOne({
      where:{
        id: dosen.prodi_id,
      },
      attributes: ['kode', 'nama']
    });

    return {
      prodi: prodi,
      dosen: dosen
    };
  }

  async getProdiByKode(kode) {
    return await this.MasterdataProdiModel.findOne({
      where: {
        kode: kode
      },
      attributes: ['kode, nama']
    });
  }

  async getMahasiswa(nim) {
    return await this.MahasiswaModel.findOne({
      where:{
        nim : nim
      },
      attributes: ['nim', 'nama']
    });
  }

  async getNegaraBySearch(negara) {
    return await this.MasterdataNegaraModel.findAll({
      where: {
        negara: {
          [Op.iLike] : '%'+negara+'%'
        }
      },
    })
  }

  async saveFormData(username, context) {
    try {
      const iku = context.state.user.state.split('-');
      const iku_number = iku[1];
      const ikuId = await this.getIkuData(iku_number);

      const user = await this.UserService.getUser(username);
      const formData = context.state.user.data.data_iku.formData;

      await this.DataIkuModel.create({
        masterdata_iku_id: ikuId.id,
        user_id: user.id,
        data: JSON.stringify(formData)
      })

      return true;
    } catch (e) {
      this.Main.Logger("Error Save Data: " + e);
      console.log("Error Save Data : " + e);
      return false;
    }
  }

  async getQuarterLists(limit = 5, offset = 0) {
    const quarters = await this.DataIkuModel.sequelize.query(
      `SELECT DISTINCT 
            CONCAT(EXTRACT(YEAR FROM created_at), '-', 'Q',
                CASE 
                  WHEN EXTRACT(MONTH FROM created_at) BETWEEN 1 AND 3 THEN 1
                  WHEN EXTRACT(MONTH FROM created_at) BETWEEN 4 AND 6 THEN 2
                  WHEN EXTRACT(MONTH FROM created_at) BETWEEN 7 AND 9 THEN 3
                  WHEN EXTRACT(MONTH FROM created_at) BETWEEN 10 AND 12 THEN 4
                END
                ) AS quarter
            FROM data_iku
            ORDER BY quarter DESC
            LIMIT :limit
            OFFSET :offset;`,
      {
        replacements: {limit, offset},
        type: QueryTypes.SELECT
      }
    );

    const [[{ total }]] = await this.DataIkuModel.sequelize.query(
      `SELECT COUNT(DISTINCT 
         CONCAT('Q',
                CASE
                    WHEN EXTRACT(MONTH FROM created_at) BETWEEN 1 AND 3 THEN 1
                    WHEN EXTRACT(MONTH FROM created_at) BETWEEN 4 AND 6 THEN 2
                    WHEN EXTRACT(MONTH FROM created_at) BETWEEN 7 AND 9 THEN 3
                    WHEN EXTRACT(MONTH FROM created_at) BETWEEN 10 AND 12 THEN 4
                    END, '-',
                EXTRACT(YEAR FROM created_at))) AS total
       FROM data_iku;`
    );

    return { quarters: quarters.map(item => item.quarter), total };
  }

  async getFormData(ikuType, periode) {
    try {
      const iku = ikuType.split('-');
      const period = periode.split('-');
      const dateRange = this.getQuarterDateRange(period[1], period[0]);
      const iku_number = iku[1];
      const masterIku = await this.getIkuData(iku_number);
      const data = await this.DataIkuModel.findAll({
        where: {
          masterdata_iku_id: masterIku.id,
          created_at: {
            [Op.between]: [dateRange.start, dateRange.end]
          }
        }
      })
      let formData = [];
      data.forEach((value) => {
        const data = JSON.parse(value.data);
        if (data.mahasiswa_id) {
          data.mahasiswa_id = data.mahasiswa_id + ';' + data.nama_mahasiswa;
        }
        formData.push(Object.values(data));
      })
      const dataIku = setupForm(masterIku);
      const label = getLabelField(Object.keys(dataIku));

      return {
        label: label,
        formData : formData,
        excelHeader: masterIku.excel_header,
        excelSheet: masterIku.excel_sheet,
      };
    } catch (e) {
      this.Main.Logger("Error get data: " + e);
      return {
        status: false,
        message: e
      };
    }
  }

  getQuarterDateRange(year, quarter) {
    let start, end;

    switch (quarter) {
      case 'Q1':
        start = `${year}-01-01`;
        end = `${year}-03-31`;
        break;
      case 'Q2':
        start = `${year}-04-01`;
        end = `${year}-06-30`;
        break;
      case 'Q3':
        start = `${year}-07-01`;
        end = `${year}-09-30`;
        break;
      case 'Q4':
        start = `${year}-10-01`;
        end = `${year}-12-31`;
        break;
    }
    return { start, end };
  }
}

export default IkuRepository;