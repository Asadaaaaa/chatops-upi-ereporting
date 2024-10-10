import UserModel from "../models/User.model.js";
import MasterdataDosenModel from "../models/MasterdataDosen.model.js";

class UserRepository {
  constructor(Main) {
    this.Main = Main
    this.UserModel = new UserModel(this.Main).table;
    this.MasterdataDosenModel = new MasterdataDosenModel(this.Main).table;
  }

  async registerUser(username, chatId) {
    try{
      const [user, created] = await this.UserModel.findOrCreate({
        where: {
          username: username,
          chat_id: chatId
        },
        defaults: {
          username: username,
          chat_id: chatId
        }
      })
      return {user, created};
    } catch (error) {
      console.log(error);
    }
  }

  async getUser(username) {
    try {
      return await this.UserModel.findOne({
        where: {
          username: username
        }
      });
    } catch (error) {
      console.log(error)
    }
  }

  async saveState(username, state, data = null) {
    try {
      const user = await this.UserModel.findOne({
        where: {
          username: username
        }
      })
      if (!user) {
        return false
      }

      let userState = JSON.parse(user.state);
      userState.state = state;
      if (data) {
        userState.data = data;
      }

      user.set({
        state: JSON.stringify(userState)
      });

      const status = await user.save();
      if (!status) {
        return false
      }

      return status;
    } catch (error) {
      console.log(error)
    }
  }

  async checkUserDosen(username) {
    const user  = await this.getUser(username);
    if (!user) return false;
    let dosen = await this.MasterdataDosenModel.findOne({
      where: {
        user_id : user.id
      }
    })

    return dosen;
  }

  async registerDosen(username, nip) {
    const user = await this.getUser(username);
    const dosen = await this.MasterdataDosenModel.findOne({
      where: {
        nip : nip
      }
    })
    if (!dosen) {
      return {
        status: 'not-found'
      };
    }
    if (dosen.user_id) {
      return {
        status: 'registered'
      };
    }

    dosen.set({
      user_id: user.id
    });
    await dosen.save();
    return {status: 'success', data: dosen} ;
  }

  async getCurrentState(username) {
    try {
      const data = await this.UserModel.findOne({
        where: {
          username: username
        }
      });

      return JSON.parse(data.state);

    } catch (error) {
      console.log(error)
    }
  }
}

export default UserRepository;