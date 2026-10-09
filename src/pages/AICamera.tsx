import React, { useState, useRef, useEffect } from 'react'
import { Camera, Image as ImageIcon, RefreshCw, AlertTriangle, CheckCircle2, Package } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RecognitionService, type RecognitionResult } from '../services/RecognitionService'
import { CameraService } from '../lib/ai/CameraService'
import { ProductService } from '../services/ProductService'
import { type Product } from '../types'
import SmartIntakePanel from '../components/ai/SmartIntakePanel'

export default function AICamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captureInputRef = useRef<HTMLInputElement>(null)
  const cameraServiceRef = useRef(new CameraService())

  const [status, setStatus] = useState<'idle' | 'analyzing' | 'confidence_check' | 'intake' | 'error'>('idle')
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<RecognitionResult['prediction'] | null>(null)
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [timing, setTiming] = useState<RecognitionResult['timing'] | null>(null)
  const [statusFlag, setStatusFlag] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState(false)

  // Initialization
  useEffect(() => {
    startCamera()
    return () => {
      cameraServiceRef.current.stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by browser or insecure origin')
      }
      if (videoRef.current) {
        await cameraServiceRef.current.startCamera(videoRef.current)
        setCameraError(false)
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      if (err.name !== 'AbortError') {
        setCameraError(true)
      }
    }
  }

  const handleCapture = async () => {
    if (!videoRef.current) return
    try {
      const dataUrl = cameraServiceRef.current.captureFrame()
      if (dataUrl) {
        cameraServiceRef.current.stopCamera()
        const res = await fetch(dataUrl)
        const blob = await res.blob()
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        processImage(file)
      }
    } catch (err) {
      console.error('Error capturing frame:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processImage(file)
    }
  }

  const processImage = async (file: File) => {
    setStatus('analyzing')
    setErrorMessage(null)
    setPrediction(null)
    setMatchedProduct(null)
    setTiming(null)
    setStatusFlag(null)

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setImageSrc(e.target?.result as string)
    reader.readAsDataURL(file)

    const result = await RecognitionService.recognizeImage(file)
    setTiming(result.timing)
    setStatusFlag(result.status)
    console.log('[AI Pipeline Timing]', result.timing)

    if (result.success && result.status === 'SUCCESS' && result.prediction) {
      setPrediction(result.prediction)
      
      // Confidence Gate
      if (result.prediction.confidence < 0.90) {
        setStatus('confidence_check')
      } else {
        await proceedToIntake(result.prediction)
      }
    } else {
      setStatus('error')
      switch (result.status) {
        case 'MULTIPLE_PRODUCTS_FOUND':
          setErrorMessage('Multiple products detected. Please scan one product at a time.')
          break
        case 'IMAGE_TOO_BLURRY':
          setErrorMessage('Image is too blurry. Please take a clearer photo.')
          break
        case 'LOW_LIGHT':
          setErrorMessage('Low light detected. Please ensure the product is well-lit.')
          break
        case 'PARTIAL_PRODUCT':
          setErrorMessage('Product is cut off. Please ensure the whole product is visible.')
          break
        case 'NO_PRODUCT_FOUND':
          setErrorMessage('No stationery product found in the image.')
          break
        case 'INVALID_IMAGE':
          setErrorMessage('The image format, resolution, or size is not supported.')
          break
        case 'API_TIMEOUT':
          setErrorMessage('The AI service took too long to respond. Please try again.')
          break
        default:
          setErrorMessage('An unexpected error occurred during recognition.')
      }
    }
  }

  const proceedToIntake = async (pred: any) => {
    setStatus('analyzing') // Show loading while searching DB
    const match = await ProductService.findMatchingProduct(pred)
    setMatchedProduct(match)
    setStatus('intake')
  }

  const resetCamera = () => {
    setImageSrc(null)
    setPrediction(null)
    setMatchedProduct(null)
    setErrorMessage(null)
    setStatus('idle')
    setStatusFlag(null)
    startCamera()
  }

  return (
    <div className="max-w-md mx-auto min-h-[calc(100vh-140px)] flex flex-col relative pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">AI Camera</h2>
          <p className="text-muted font-medium text-sm">Smart Product Recognition</p>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 rounded-3xl overflow-hidden glass border border-brand/20 shadow-2xl mx-4 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* Camera Idle State */}
          {status === 'idle' && !imageSrc && (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              {!cameraError ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay guides */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-brand/50 rounded-3xl relative">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-brand rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-brand rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-brand rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-brand rounded-br-xl" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/60">
                  <Camera className="w-16 h-16 text-muted mb-4 opacity-50" />
                  <p className="text-white font-bold mb-2">Live Camera Unavailable</p>
                  <p className="text-muted text-sm max-w-[250px]">
                    Please use the capture button to open your device camera, or upload an image.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Captured Image Preview */}
          {imageSrc && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              <img src={imageSrc} alt="Captured" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Overlay */}
        <div className="relative z-10 flex-1 flex flex-col justify-end p-6">
          
          {status === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl text-center border border-brand/30 shadow-xl"
            >
              <RefreshCw className="w-10 h-10 text-brand mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-black mb-1">AI Processing...</h3>
              <p className="text-sm text-muted font-bold">Identifying product and matching inventory</p>
            </motion.div>
          )}

          {/* Confidence Check Gate */}
          {status === 'confidence_check' && prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl border border-amber-500/50 shadow-xl bg-amber-500/10 text-center"
            >
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-xl font-black text-white mb-1">Low Confidence ({Math.round(prediction.confidence * 100)}%)</h3>
              <p className="text-sm text-amber-200/80 mb-6 px-4">
                The AI is unsure about this product. It guessed: <br/>
                <strong className="text-white">{prediction.name}</strong>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetCamera}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                >
                  Retake
                </button>
                <button
                  onClick={() => proceedToIntake(prediction)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black rounded-xl transition-all"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          )}

          {/* Smart Intake Panel */}
          {status === 'intake' && prediction && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <SmartIntakePanel 
                prediction={prediction}
                matchedProduct={matchedProduct}
                imageSrc={imageSrc}
                onComplete={resetCamera}
                onCancel={resetCamera}
              />
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-3xl border border-red-500/30 shadow-xl bg-red-500/10"
            >
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-black text-center text-white mb-2">Recognition Failed</h3>
              <p className="text-sm text-red-200/80 text-center font-medium mb-6">
                {errorMessage}
              </p>
              
              {statusFlag && (
                <div className="text-[10px] text-red-300/50 text-center font-mono mb-4 uppercase tracking-wider">
                  [{statusFlag}]
                </div>
              )}

              <button
                onClick={resetCamera}
                className="w-full py-3.5 glass hover:bg-white/10 border border-white/10 rounded-2xl font-black flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Controls (Only in idle state) */}
      <AnimatePresence>
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-2xl glass flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 shadow-xl"
              title="Upload Image"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            
            {/* Capture Button */}
            {!cameraError ? (
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-brand flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(219,255,0,0.3)]"
                title="Capture Photo"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-black" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => captureInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-brand flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(219,255,0,0.3)]"
                title="Open Device Camera"
              >
                <div className="w-16 h-16 rounded-full border-4 border-black/20 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-black" />
                </div>
              </button>
            )}
            
            <div className="w-14 h-14" /> {/* Spacer for symmetry */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Upload Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Hidden Capture Fallback Input */}
      <input
        type="file"
        ref={captureInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
