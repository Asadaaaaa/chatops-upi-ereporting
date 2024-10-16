import path from 'path';
import axios from "axios";
class FileService {
  constructor(Main, iku) {
    this.Main = Main;
    this.fs = this.Main.FS;
    this.botToken = this.Main.env.TELEGRAM_BOT_KEY;
    this.storageUrl = this.Main.env.STORAGE_URL;
    this.path = process.cwd()+'/server_data/iku_files/'+ iku;
  }

  async downloadFile(document) {
    const url = this.storageUrl + '/storage/store';
    return await axios.post(url,{
      bot_token: this.botToken,
      file_id: document.file_id,
      file_name: document.file_name,
      mime_type: document.mime_type
    })
      .then((response) => {
        return response.data.data.filePath;
      })
      .catch((error) => {
        console.log(error.response.data);
        return false;
      });
  }
}

export default FileService;