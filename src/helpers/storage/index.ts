const fs = require('fs');

export class Storage {
  private data: Record<string, any> = {};

  constructor() {
    this.getData();
  }

  private getData() {
    fs.readFile('data.json', 'utf8', (err: any, data: any) => {
      if (!err && data) {
        this.data = JSON.parse(data);
        console.log('Successfully loaded from File.');
      }
    });
  }

  private writeFile() {
    fs.writeFile('data.json', JSON.stringify(this.data), (err: any) => {
      if (err) {
        console.log(err);
      }
      console.log('Successfully written to File.');
    });
  }

  public setItem(key: string, data: any) {
    this.data[key] = data;
    this.writeFile();
  }

  public getItem(key: string) {
    return this.data[key];
  }

  public hasItem(key: string) {
    return !!this.getItem(key);
  }

  public getSize() {
    const stats = fs.statSync('data.json');
    const fileSizeInBytes = stats.size;
    return (fileSizeInBytes / (1024 * 1024)).toFixed(3);
  }

  public async clearData() {
    this.data = {};
    return new Promise<boolean>((resolve) => {
      fs.unlink('data.json', () => {
        resolve(true);
      });
    });
  }
}
