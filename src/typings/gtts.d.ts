declare module 'node-google-tts-api' {
  export default class gtts {
    constructor();
    get(options: { text: string; lang: 'en' }): Promise<Buffer | Buffer[]>;
  }
}
