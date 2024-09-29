import MasterdataIKUModel from "../models/MasterdataIKU.model.js";

class MenuService {
  constructor(Main) {
    this.Main = Main
    this.MasterdataIkuModel = new MasterdataIKUModel(this.Main).table;
  }

  async showMenu() {
    const getMasterdataIKU = await this.MasterdataIkuModel.findAll({
      where: {
        is_active: true
      },
      attributes: ['uuid', 'nomor', 'nama']
    });
    return getMasterdataIKU;
  }

}

export default MenuService;