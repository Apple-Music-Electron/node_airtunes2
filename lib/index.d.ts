// Path: node_modules/airtunes2/lib/index.d.ts
declare module 'airtunes2' {
  export = AirTunes.Client;
}

declare namespace AirTunes {

  /**
   * AirTunes Casting Device
   */
  class CastDevice {
    name: string
    host: string
    port: number
    addresses: string | string[]
    txt: string[]
    airplay2: boolean
  }

  /**
   * AirTunes Controller
   */
  class Controller {
    key: string
    setPasscode(passcode: string): void
    setVolume(volume: number, cb?: Function): void
    stop(cb?: Function): void
    on(event: 'status', cb: (status: string) => void): void
  }

  /**
   * AirTunes Device
   * @param port The port of the device as reported by Zeroconf (default: 5000)
   * @param volume The initial volume, which must be between 0 and 100. (default: 50)
   * @param password The password for the device, if required. Bonjour indicates if the device demands a password.
   */
  interface AirPlayDevice {
    port: number
    volume: number
    password?: string
    txt: string
    airplay2: boolean
    debug: boolean
    forceAlac: boolean
  }

  interface CircularBuffer {
    write(data: Buffer): void
  }

  /**
   * AirTunes Server
   */
  class Client {
    constructor();

    /**
     * Add a airtunes device
     * @param host The IP address of the device reported by Zeroconf (ipv4)
     * @param options The options for the device (port, volume, password)
     * @param mode The mode of the device (0 = local, 1 = remote, 2 = dual)
     * @param txt The txt record of the device
     */
    add(host: string, options: AirPlayDevice, mode?: number, txt?: string): Controller;

    /**
     * Stop all devices
     */
    stopAll(cb: Function): void

    /**
     * Stop a device
     */
    stop(deviceKey: string, cb?: Function): void

    /**
     * End the circular buffer
     */
    end(): void

    /**
     * Set the volume of a device
     * @param deviceKey The key of the device
     * @param volume The volume to set (0-100)
     * @param cb The callback function
     */
    setVolume(deviceKey: string, volume: string, cb?: Function): void

    /**
     * Set the current playback position of a device
     * @param deviceKey The key of the device
     * @param progress The progress to set (0-1)
     * @param duration The duration of the track
     * @param callback The callback function
     */
    setProgress(deviceKey: string, progress: number, duration: number, callback?: Function): void

    /**
     * Set the playback state of a device
     * @param deviceKey The key of the device
     * @param name The name of the track
     * @param artist The artist of the track
     * @param album The album of the track
     * @param callback The callback function
     */
    setTrackInfo(deviceKey: string, name: string, artist: string, album: string, callback?: Function): void

    /**
     * Reset the AirTunes client
     */
    reset(): void

    /**
     * Set the artwork of a device
     * @param deviceKey The key of the device
     * @param art The artwork to set
     * @param contentType The content type of the artwork
     * @param callback The callback function
     */
    setArtwork(deviceKey: string, art: string | Buffer, contentType: string, callback?: Function): void


    /**
     * Set the passcode of a device
     * @param deviceKey The key of the device
     * @param passcode The passcode to set
     */
    setPasscode(deviceKey: string, passcode: string): void


    // Untyped methods
    addCoreAudio(options: Object): void
    write(data: string): void

    // Untyped properties
    circularBuffer: CircularBuffer
    devices: unknown
    writable: boolean
  }

}
