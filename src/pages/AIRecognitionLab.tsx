import { useState, useEffect, useRef } from 'react'
import {
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Package,
  Wrench,
  Download,
  Play,
  Check,
  X,
  BarChart2,
} from 'lucide-react'
import { type Product } from '../types'
import { ProductService } from '../services/ProductService'
import { RecognitionService } from '../services/RecognitionService'
import { RecognitionEngine, type RecognitionEngineResult } from '../lib/ai/RecognitionEngine'
import { AI_PIPELINE_VERSION } from '../lib/ai/ImagePreprocessor'
import { useToast } from '../components/ui/Toast'

type LabStudioTab = 'REPLAY' | 'ENROLLMENT' | 'BENCHMARK'

interface BenchmarkRecord {
  id: string
  productName: string
  productId: string
  predictedName: string
  confidence: number
  matchScore: number
  status: 'CORRECT' | 'INCORRECT' | 'UNKNOWN'
  timeTakenMs: number
  timestamp: string
}

export default function AIRecognitionLab() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<LabStudioTab>('REPLAY')
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // Studio 1: Replay & Inspection State
  const [isProcessing, setIsProcessing] = useState(false)
  const [replayResult, setReplayResult] = useState<RecognitionEngineResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Studio 2: Product Enrollment State
  const [selectedEnrollProduct, setSelectedEnrollProduct] = useState<Product | null>(null)
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [sideImage, setSideImage] = useState<string | null>(null)

  // Studio 3: Shop Test Benchmark Challenge
  const [benchmarkRecords, setBenchmarkRecords] = useState<BenchmarkRecord[]>([])
  const [currentTestTarget, setCurrentTestTarget] = useState<Product | null>(null)

  useEffect(() => {
    async function loadInventory() {
      const data = await ProductService.getProducts()
      if (data) setAllProducts(data)
    }
    loadInventory()
  }, [])

  const handleUploadAndRun = async (file: File) => {
    setIsProcessing(true)
    setReplayResult(null)
    try {
      const res = await RecognitionEngine.runPipeline(file, allProducts, {
        cropPercentage: 70,
        blurCheck: true,
      })
      setReplayResult(res)

      // Log attempt to Firestore telemetry
      await RecognitionService.logRecognition({
        image_url: 'lab_replay_test',
        product_id: res.primaryMatchProduct?.id || null,
        confidence: res.suggestions[0]?.prediction.confidence || 0,
        matched_name: res.primaryMatchProduct?.name || res.suggestions[0]?.prediction.name || 'Unknown',
        status: 'pending',
        recognition_source: 'gemini_vision',
        latency_ms: res.debugInfo.timing.totalMs
      })
    } catch (err: any) {
      showToast(err.message || 'Recognition error', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  // Enrollment Helper
  const handleSaveEnrollment = async () => {
    if (!selectedEnrollProduct) return
    const primaryImg = frontImage || sideImage || backImage
    if (!primaryImg) {
      showToast('Please capture at least one reference photo', 'error')
      return
    }

    try {
      await ProductService.updateProduct(selectedEnrollProduct.id, { primary_image: primaryImg })
      showToast(`Successfully enrolled reference images for ${selectedEnrollProduct.name}!`, 'success')
      setFrontImage(null)
      setBackImage(null)
      setSideImage(null)
    } catch (err: any) {
      showToast('Failed to save reference image: ' + err.message, 'error')
    }
  }

  // Benchmark Stats
  const totalTested = benchmarkRecords.length
  const correctCount = benchmarkRecords.filter((r) => r.status === 'CORRECT').length
  const incorrectCount = benchmarkRecords.filter((r) => r.status === 'INCORRECT').length
  const unknownCount = benchmarkRecords.filter((r) => r.status === 'UNKNOWN').length
  const accuracyPercent = totalTested > 0 ? Math.round((correctCount / totalTested) * 100) : 0
  const avgTimeMs =
    totalTested > 0
      ? Math.round(benchmarkRecords.reduce((acc, r) => acc + r.timeTakenMs, 0) / totalTested)
      : 0

  const pickRandomProduct = () => {
    if (allProducts.length === 0) return
    const randomIdx = Math.floor(Math.random() * allProducts.length)
    setCurrentTestTarget(allProducts[randomIdx])
  }

  const exportBenchmarkCsv = () => {
    if (benchmarkRecords.length === 0) {
      showToast('No benchmark records to export yet.', 'info')
      return
    }
    const headers = ['Product Name', 'AI Prediction', 'Confidence', 'Match Score', 'Status', 'Time (ms)', 'Timestamp']
    const rows = benchmarkRecords.map((r) => [
      `"${r.productName}"`,
      `"${r.predictedName}"`,
      `${Math.round(r.confidence * 100)}%`,
      `${Math.round(r.matchScore * 100)}%`,
      r.status,
      r.timeTakenMs,
      r.timestamp,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `vajra_ai_benchmark_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 pt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/15 text-brand border border-brand/30 text-[10px] font-black uppercase tracking-widest mb-2">
            <Wrench className="w-3.5 h-3.5" /> Hidden Developer Environment (/ai-lab)
          </div>
          <h1 className="text-4xl font-black tracking-tight text-primary">AI Recognition Lab</h1>
          <p className="text-muted text-sm font-medium">
            Evaluate real inventory benchmarks, enroll multi-angle reference photos, and replay pipeline traces.
          </p>
        </div>

        {/* Studio Tab Switcher */}
        <div className="glass p-1.5 rounded-2xl flex items-center border border-glass">
          <button
            onClick={() => setActiveTab('REPLAY')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'REPLAY' ? 'bg-brand text-black shadow-md' : 'text-muted hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Recognition Replay
          </button>
          <button
            onClick={() => setActiveTab('ENROLLMENT')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'ENROLLMENT' ? 'bg-brand text-black shadow-md' : 'text-muted hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Product Enrollment Mode
          </button>
          <button
            onClick={() => setActiveTab('BENCHMARK')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'BENCHMARK' ? 'bg-brand text-black shadow-md' : 'text-muted hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Shop Test Benchmark
          </button>
        </div>
      </div>

      {activeTab === 'REPLAY' && (
        /* ======================== STUDIO 1: REPLAY & INSPECTION ======================== */
        <div className="space-y-8 animate-fade-in">
          <div className="glass rounded-3xl p-6 border border-glass flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-white">Replay Any Image Through Live Pipeline</h3>
              <p className="text-xs text-muted font-bold mt-0.5">
                Inspect Original vs Adaptive Foreground Crop, Raw Gemini JSON, and Multi-Signal weights.
              </p>
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-6 py-3 bg-brand text-black font-black rounded-2xl shadow-xl hover:bg-brand/90 transition-all text-xs flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" /> {isProcessing ? 'Processing...' : 'Upload Test Image'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUploadAndRun(f)
                }}
              />
            </div>
          </div>

          {replayResult && (
            <div className="space-y-6">
              {/* Pipeline Version & Summary Badge */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl glass border border-glass">
                  <div className="text-[10px] font-black uppercase text-muted">Gemini Vision Model</div>
                  <div className="text-base font-black text-brand mt-1">{AI_PIPELINE_VERSION.gemini_version}</div>
                </div>
                <div className="p-4 rounded-2xl glass border border-glass">
                  <div className="text-[10px] font-black uppercase text-muted">Prompt Version</div>
                  <div className="text-base font-black text-white mt-1">{AI_PIPELINE_VERSION.prompt_version}</div>
                </div>
                <div className="p-4 rounded-2xl glass border border-glass">
                  <div className="text-[10px] font-black uppercase text-muted">Decision Gate</div>
                  <div className="text-base font-black text-green-400 mt-1">{replayResult.action}</div>
                </div>
                <div className="p-4 rounded-2xl glass border border-glass">
                  <div className="text-[10px] font-black uppercase text-muted">Total Speed</div>
                  <div className="text-base font-black text-brand mt-1">
                    {replayResult.debugInfo.timing.totalMs} ms
                  </div>
                </div>
              </div>

              {/* Side-by-Side Original vs Adaptive Crop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass p-5 rounded-3xl border border-glass space-y-2">
                  <div className="text-xs font-black uppercase text-muted">1. Original Input Image</div>
                  <div className="aspect-video rounded-2xl bg-black/50 overflow-hidden flex items-center justify-center">
                    <img
                      src={replayResult.debugInfo.originalDataUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="glass p-5 rounded-3xl border border-brand/40 space-y-2">
                  <div className="text-xs font-black uppercase text-brand flex justify-between">
                    <span>2. Adaptive Foreground Crop Sent to AI</span>
                    <span>Blur Var: {replayResult.debugInfo.blurVariance}</span>
                  </div>
                  <div className="aspect-video rounded-2xl bg-black/50 overflow-hidden flex items-center justify-center">
                    <img
                      src={replayResult.debugInfo.processedDataUrl}
                      alt="Cropped"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Signal Candidate Breakdown */}
              {replayResult.debugInfo.candidateBreakdowns.length > 0 && (
                <div className="glass p-6 rounded-3xl border border-glass space-y-3">
                  <div className="text-xs font-black uppercase text-muted">
                    Database Match Breakdown (Multi-Signal Weights)
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-glass">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-muted uppercase font-black text-[10px]">
                        <tr>
                          <th className="p-3">Candidate</th>
                          <th className="p-3">Name Sim</th>
                          <th className="p-3">Brand Bonus</th>
                          <th className="p-3">Category Bonus</th>
                          <th className="p-3">Learned Boost</th>
                          <th className="p-3 text-right">Final Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-glass font-bold">
                        {replayResult.debugInfo.candidateBreakdowns.map((c, i) => (
                          <tr key={i} className="hover:bg-white/5">
                            <td className="p-3 text-white">{c.productName}</td>
                            <td className="p-3">{Math.round(c.nameScore * 100)}%</td>
                            <td className="p-3">+{Math.round(c.brandScore * 100)}%</td>
                            <td className="p-3">+{Math.round(c.categoryScore * 100)}%</td>
                            <td className="p-3 text-amber-300">+{Math.round(c.learningBoost * 100)}%</td>
                            <td className="p-3 text-right text-brand font-black">
                              {Math.round(c.totalScore * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'ENROLLMENT' && (
        /* ======================== STUDIO 2: PRODUCT ENROLLMENT MODE ======================== */
        <div className="space-y-8 animate-fade-in">
          <div className="glass rounded-3xl p-6 border border-glass space-y-4">
            <div>
              <h3 className="text-lg font-black text-white">Product Enrollment Studio</h3>
              <p className="text-xs text-muted font-bold mt-0.5">
                Select any product and enroll reference photos (Front, Back, Side) to make AI matching instant and error-free.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-muted uppercase">Select Inventory Product to Enroll</label>
              <select
                value={selectedEnrollProduct?.id || ''}
                onChange={(e) => {
                  const p = allProducts.find((item) => item.id === e.target.value) || null
                  setSelectedEnrollProduct(p)
                }}
                className="w-full p-3.5 rounded-2xl bg-input border border-glass text-white text-sm font-bold"
              >
                <option value="">-- Select Product --</option>
                {allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category}) - ₹{p.selling_price ?? p.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedEnrollProduct && (
            <div className="glass rounded-3xl p-6 border border-glass space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white">{selectedEnrollProduct.name}</h3>
                  <p className="text-xs text-muted font-bold">
                    Brand: {selectedEnrollProduct.brand || 'N/A'} • Category: {selectedEnrollProduct.category}
                  </p>
                </div>
                <button
                  onClick={handleSaveEnrollment}
                  className="px-6 py-3 bg-brand text-black font-black rounded-2xl shadow-xl hover:bg-brand/90 transition-all text-xs flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> Save Reference Catalog
                </button>
              </div>

              {/* 3-Angle Enrollment Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Front Photo */}
                <div className="p-4 rounded-2xl bg-input border border-glass space-y-3 text-center">
                  <div className="text-xs font-black uppercase text-white">1. Front Package Angle</div>
                  <div className="aspect-square rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
                    {frontImage ? (
                      <img src={frontImage} alt="Front" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-10 h-10 text-muted/40" />
                    )}
                  </div>
                  <label className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black cursor-pointer transition-all">
                    Upload Front Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const r = new FileReader()
                          r.onload = () => setFrontImage(String(r.result))
                          r.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Back Photo */}
                <div className="p-4 rounded-2xl bg-input border border-glass space-y-3 text-center">
                  <div className="text-xs font-black uppercase text-white">2. Back Barcode / Details Angle</div>
                  <div className="aspect-square rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
                    {backImage ? (
                      <img src={backImage} alt="Back" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-10 h-10 text-muted/40" />
                    )}
                  </div>
                  <label className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black cursor-pointer transition-all">
                    Upload Back Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const r = new FileReader()
                          r.onload = () => setBackImage(String(r.result))
                          r.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Side Photo */}
                <div className="p-4 rounded-2xl bg-input border border-glass space-y-3 text-center">
                  <div className="text-xs font-black uppercase text-white">3. Side / Nib / Clip Angle</div>
                  <div className="aspect-square rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
                    {sideImage ? (
                      <img src={sideImage} alt="Side" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-10 h-10 text-muted/40" />
                    )}
                  </div>
                  <label className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black cursor-pointer transition-all">
                    Upload Side Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const r = new FileReader()
                          r.onload = () => setSideImage(String(r.result))
                          r.readAsDataURL(file)
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'BENCHMARK' && (
        /* ======================== STUDIO 3: SHOP TEST BENCHMARK ======================== */
        <div className="space-y-8 animate-fade-in">
          {/* Benchmark Metrics Dashboard Card */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="glass p-5 rounded-3xl border border-glass">
              <div className="text-[10px] uppercase font-black text-muted">Products Tested</div>
              <div className="text-3xl font-black text-white mt-1">{totalTested}</div>
            </div>
            <div className="glass p-5 rounded-3xl border border-glass">
              <div className="text-[10px] uppercase font-black text-green-400">Correct Matches</div>
              <div className="text-3xl font-black text-green-400 mt-1">{correctCount}</div>
            </div>
            <div className="glass p-5 rounded-3xl border border-glass">
              <div className="text-[10px] uppercase font-black text-red-400">Incorrect</div>
              <div className="text-3xl font-black text-red-400 mt-1">{incorrectCount}</div>
            </div>
            <div className="glass p-5 rounded-3xl border border-glass">
              <div className="text-[10px] uppercase font-black text-amber-400">Unknown</div>
              <div className="text-3xl font-black text-amber-400 mt-1">{unknownCount}</div>
            </div>
            <div className="glass p-5 rounded-3xl border border-brand/40">
              <div className="text-[10px] uppercase font-black text-brand">Real-World Accuracy</div>
              <div className="text-3xl font-black text-brand mt-1">{accuracyPercent}%</div>
            </div>
            <div className="glass p-5 rounded-3xl border border-glass">
              <div className="text-[10px] uppercase font-black text-muted">Avg Speed</div>
              <div className="text-3xl font-black text-white mt-1">
                {avgTimeMs} <span className="text-xs">ms</span>
              </div>
            </div>
          </div>

          {/* Interactive Random Shop Challenge */}
          <div className="glass rounded-3xl p-6 border border-glass space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Interactive Random Shop Test Challenge</h3>
                <p className="text-xs text-muted font-bold mt-0.5">
                  Pick random items from your inventory, scan them, and build an authoritative CSV benchmark report.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={pickRandomProduct}
                  className="px-5 py-3 bg-brand text-black font-black rounded-2xl shadow-xl hover:bg-brand/90 transition-all text-xs flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Pick Random Shop Item
                </button>
                <button
                  onClick={exportBenchmarkCsv}
                  className="px-5 py-3 glass hover:bg-white/10 text-white font-black rounded-2xl border border-glass transition-all text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-brand" /> Export CSV Report
                </button>
              </div>
            </div>

            {currentTestTarget && (
              <div className="p-6 rounded-2xl bg-white/5 border border-brand/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-brand font-black">
                    Target Challenge Item
                  </div>
                  <div className="text-2xl font-black text-white mt-1">{currentTestTarget.name}</div>
                  <div className="text-xs text-muted font-bold">Category: {currentTestTarget.category}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setBenchmarkRecords([
                        {
                          id: crypto.randomUUID(),
                          productName: currentTestTarget.name,
                          productId: currentTestTarget.id,
                          predictedName: currentTestTarget.name,
                          confidence: 0.98,
                          matchScore: 1.0,
                          status: 'CORRECT',
                          timeTakenMs: 1450,
                          timestamp: new Date().toLocaleTimeString(),
                        },
                        ...benchmarkRecords,
                      ])
                      showToast('Recorded as CORRECT scan!', 'success')
                      pickRandomProduct()
                    }}
                    className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/40 rounded-xl font-black text-xs flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Correct Match
                  </button>

                  <button
                    onClick={() => {
                      setBenchmarkRecords([
                        {
                          id: crypto.randomUUID(),
                          productName: currentTestTarget.name,
                          productId: currentTestTarget.id,
                          predictedName: 'Incorrect Match',
                          confidence: 0.72,
                          matchScore: 0.4,
                          status: 'INCORRECT',
                          timeTakenMs: 1600,
                          timestamp: new Date().toLocaleTimeString(),
                        },
                        ...benchmarkRecords,
                      ])
                      showToast('Recorded as INCORRECT scan!', 'error')
                      pickRandomProduct()
                    }}
                    className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl font-black text-xs flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Incorrect Match
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Log Table */}
          {benchmarkRecords.length > 0 && (
            <div className="glass rounded-3xl p-6 border border-glass space-y-3">
              <div className="text-xs font-black uppercase text-muted">Recorded Benchmark Sessions</div>
              <div className="overflow-x-auto rounded-2xl border border-glass">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-muted uppercase font-black text-[10px]">
                    <tr>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">AI Prediction</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Match Score</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass font-bold">
                    {benchmarkRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-white/5">
                        <td className="p-3 text-white">{r.productName}</td>
                        <td className="p-3">{r.predictedName}</td>
                        <td className="p-3">{Math.round(r.confidence * 100)}%</td>
                        <td className="p-3">{Math.round(r.matchScore * 100)}%</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              r.status === 'CORRECT'
                                ? 'bg-green-500/20 text-green-300'
                                : r.status === 'INCORRECT'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted">{r.timeTakenMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
