// Path: node_modules/airtunes2/lib/index.d.ts
declare module 'airtunes2'

declare class AirTunes {
  constructor();
  add(host: string, options: Object, mode: number, txt: string): void;
  addCoreAudio(options: Object): void
  stopAll(cb: Function): void
  setVolume(deviceKey: string, volume: string, cb: Function): void
  setProgress(deviceKey: string, progress: number, duration: number, callback: Function): void
  setTrackInfo(deviceKey: string, name: string, artist: string, album: string, callback: Function): void
  reset(): void
  setArtwork(deviceKey: string, art: string, contentType: string, callback: Function): void
  write(data: string): void
}

