import path from 'path';
import axios from "axios";
class FileService {
  constructor(Main, iku) {
    this.Main = Main;
    this.fs = this.Main.FS;
    this.botToken = this.Main.env.TELEGRAM_BOT_KEY;
    this.path = process.cwd()+'/src/resources/iku_files/'+ iku;
  }

  async downloadFile(fileId) {
    try {
      // Step 1: Get the file path from Telegram
      const fileResponse = await axios.get(`https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`);
      const filePath = fileResponse.data.result.file_path;

      // Step 2: Download the file using the file path
      const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
      const response = await axios.get(fileUrl, { responseType: 'stream' });

      // Step 3: Save the file locally

      if (!this.fs.existsSync(this.path)) {
        this.fs.mkdirSync(this.path);
      }
      const fullPath = path.resolve(this.path, path.basename(filePath));
      const writer = this.fs.createWriteStream(fullPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(fullPath));
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('Error downloading file:', error);
      return false;
    }
  }
}

export default FileService;