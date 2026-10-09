export type FacingMode = 'environment' | 'user'

export interface CameraState {
  hasFlash: boolean
  isFlashOn: boolean
  facingMode: FacingMode
}

export class CameraService {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private facingMode: FacingMode = 'environment'
  private isFlashOn = false
  private hasFlash = false

  /**
   * Starts video stream on provided HTMLVideoElement
   */
  async startCamera(videoEl: HTMLVideoElement, facing: FacingMode = 'environment'): Promise<CameraState> {
    this.stopCamera()
    this.videoElement = videoEl
    this.facingMode = facing

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      audio: false,
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
      videoEl.srcObject = this.stream
      await videoEl.play().catch(e => {
        if (e.name !== 'AbortError') throw e
      })

      // Check flash capability
      const track = this.stream.getVideoTracks()[0]
      const capabilities = track?.getCapabilities ? track.getCapabilities() : {}
      this.hasFlash = Boolean((capabilities as any).torch)

      return {
        hasFlash: this.hasFlash,
        isFlashOn: this.isFlashOn,
        facingMode: this.facingMode,
      }
    } catch (error) {
      console.warn('Error starting camera stream:', error)
      throw error
    }
  }

  /**
   * Switches facing mode between environment (back) and user (front)
   */
  async switchCamera(videoEl: HTMLVideoElement): Promise<CameraState> {
    const nextFacing: FacingMode = this.facingMode === 'environment' ? 'user' : 'environment'
    return this.startCamera(videoEl, nextFacing)
  }

  /**
   * Toggles flash/torch if supported
   */
  async toggleFlash(): Promise<boolean> {
    if (!this.stream || !this.hasFlash) return false
    const track = this.stream.getVideoTracks()[0]
    if (!track) return false

    this.isFlashOn = !this.isFlashOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: this.isFlashOn } as any],
      })
      return this.isFlashOn
    } catch (e) {
      console.warn('Torch constraint error:', e)
      return false
    }
  }

  /**
   * Captures current frame from video element as Data URL
   */
  captureFrame(): string | null {
    if (!this.videoElement) return null
    const canvas = document.createElement('canvas')
    canvas.width = this.videoElement.videoWidth || 1280
    canvas.height = this.videoElement.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.88)
  }

  /**
   * Stops video stream and turns off torch
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => {
        t.stop()
      })
      this.stream = null
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null
    }
    this.isFlashOn = false
  }
}
