import UserModel from "../models/User.model.js";
import MahasiswaModel from "../models/Mahasiswa.model.js";
import MasterdataDosenModel from "../models/MasterdataDosen.model.js";
import MasterdataIKUModel from "../models/MasterdataIKU.model.js";
import MasterdataFakultasModel from "../models/MasterdataFakultas.model.js";
import MasterdataProdiModel from "../models/MasterdataProdi.model.js";
import DataIKUModel from "../models/DataIKU.model.js";
import UserService from "./User.repository.js";

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
}

export default IkuRepository;