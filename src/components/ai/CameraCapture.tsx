import { useRef, useState, useEffect } from 'react'
import { Camera, Image as ImageIcon, Trash2, Star, X } from 'lucide-react'
import { StorageService } from '../../services/StorageService'
import { CameraService } from '../../lib/ai/CameraService'
import { useToast } from '../ui/Toast'

interface CameraCaptureProps {
  productId?: string
  images: string[]
  primaryImage: string | null
  onImagesChange: (images: string[], primaryImage: string | null) => void
  isUploading: boolean
  setIsUploading: (val: boolean) => void
}

export default function CameraCapture({
  productId,
  images,
  primaryImage,
  onImagesChange,
  isUploading,
  setIsUploading,
}: CameraCaptureProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraServiceRef = useRef(new CameraService())
  const { showToast } = useToast()

  const [showLiveCamera, setShowLiveCamera] = useState(false)

  useEffect(() => {
    return () => {
      cameraServiceRef.current.stopCamera()
    }
  }, [])

  const startLiveCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported')
      }
      setShowLiveCamera(true)
      // wait for render
      setTimeout(async () => {
        if (videoRef.current) {
          await cameraServiceRef.current.startCamera(videoRef.current)
        }
      }, 100)
    } catch (err: any) {
      console.error('Failed to start live camera:', err)
      setShowLiveCamera(false)
      // Fallback to file picker
      cameraInputRef.current?.click()
    }
  }

  const stopLiveCamera = () => {
    cameraServiceRef.current.stopCamera()
    setShowLiveCamera(false)
  }

  const handleLiveCapture = async () => {
    if (!videoRef.current) return
    const dataUrl = cameraServiceRef.current.captureFrame()
    if (dataUrl) {
      stopLiveCamera()
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      const dt = new DataTransfer()
      dt.items.add(file)
      handleFilesSelected(dt.files)
    }
  }

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    setIsUploading(true)
    const newUrls: string[] = []

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i]
        const uploadId = productId || ('capture_' + Date.now())
        const url = await StorageService.saveProductImage(uploadId, file, i === 0 ? 'front' : 'side')
        newUrls.push(url)
      }

      const updatedList = [...images, ...newUrls]
      const newPrimary = primaryImage || updatedList[0] || null

      onImagesChange(updatedList, newPrimary)
      showToast(`Successfully uploaded ${newUrls.length} image(s)!`, 'success')
    } catch (err: any) {
      showToast('Error uploading image: ' + err.message, 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (urlToRemove: string) => {
    const updated = images.filter((u) => u !== urlToRemove)
    const updatedPrimary =
      primaryImage === urlToRemove ? (updated.length > 0 ? updated[0] : null) : primaryImage
    onImagesChange(updated, updatedPrimary)
  }

  const setAsPrimary = (url: string) => {
    onImagesChange(images, url)
  }

  return (
    <div className="space-y-4">
      {showLiveCamera ? (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-brand/30 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={stopLiveCamera}
                className="w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleLiveCapture}
                className="w-16 h-16 rounded-full bg-brand flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(219,255,0,0.5)]"
              >
                <div className="w-12 h-12 rounded-full border-4 border-black/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-black" />
                </div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {/* Take Photo Button (Direct Camera Capture on mobile) */}
          <button
            type="button"
            disabled={isUploading}
            onClick={startLiveCamera}
            className="flex-1 min-w-[150px] px-5 py-3.5 bg-brand/15 hover:bg-brand text-brand hover:text-black rounded-2xl font-black text-sm border border-brand/30 transition-all flex items-center justify-center gap-2 shadow-lg group"
          >
            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Take Photo</span>
          </button>

        {/* Upload from Gallery Button */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 min-w-[150px] px-5 py-3.5 glass hover:bg-white/10 text-white rounded-2xl font-black text-sm border border-glass transition-all flex items-center justify-center gap-2"
        >
          <ImageIcon className="w-5 h-5 text-brand" />
          <span>Upload from Gallery</span>
        </button>

        {/* Hidden Camera Input */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />

        {/* Hidden Gallery Input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
      </div>
      )}

      {isUploading && (
        <div className="p-4 glass rounded-2xl flex items-center justify-center gap-3 text-brand text-sm font-bold animate-pulse">
          <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          <span>Uploading product photo...</span>
        </div>
      )}

      {/* Image Thumbnails Gallery */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
          {images.map((imgUrl, index) => {
            const isCover = primaryImage === imgUrl || (!primaryImage && index === 0)

            return (
              <div
                key={imgUrl}
                className={`relative aspect-square rounded-2xl overflow-hidden group border-2 transition-all ${
                  isCover ? 'border-brand shadow-[0_0_15px_rgba(197,160,89,0.4)]' : 'border-glass'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Product shot ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-between items-center">
                    {isCover ? (
                      <span className="text-[9px] bg-brand text-black px-1.5 py-0.5 rounded font-black uppercase">
                        Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsPrimary(imgUrl)}
                        className="text-[9px] bg-black/80 text-white px-1.5 py-0.5 rounded font-bold hover:bg-brand hover:text-black transition-colors"
                      >
                        Set Cover
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeImage(imgUrl)}
                      className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isCover && (
                  <div className="absolute bottom-1.5 right-1.5 bg-brand text-black p-1 rounded-full shadow">
                    <Star className="w-3 h-3 fill-black" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
