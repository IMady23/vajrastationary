import { Camera, Sparkles, ArrowRight, Cpu, ShieldCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function AICameraPlaceholder() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/15 text-brand border border-brand/30 font-black text-xs uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Phase 2 AI Vision Roadmap
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tight text-primary uppercase">
          <span className="gold-gradient">AI Camera</span> Auto-Recognition
        </h1>

        <p className="text-muted text-base md:text-lg max-w-2xl mx-auto font-medium">
          Navigation & modular architecture established. In Phase 2, simply point your camera at any shelf or product to instantly auto-fill stationery details.
        </p>
      </motion.div>

      {/* Interactive Phase 2 Preview Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-8 md:p-12 border-2 border-brand/30 shadow-[0_0_50px_rgba(197,160,89,0.15)] space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-input border border-glass space-y-3">
            <div className="p-3 bg-brand/20 text-brand rounded-xl w-fit">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-primary">1. Snap Photo</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Take a front or shelf shot using your phone camera directly from the inventory workflow.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-input border border-glass space-y-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl w-fit">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-primary">2. AI Visual Match</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Multimodal AI Vision compares the image with stored product photos and stationery catalog data.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-input border border-glass space-y-3">
            <div className="p-3 bg-green-500/20 text-green-400 rounded-xl w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-primary">3. Auto-Fill Form</h3>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Product Name, Category, Brand, and Shelf Location are automatically populated in &lt;1 second.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0a162e] border border-brand/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="font-black text-lg text-white">Phase 1 Database Ready</h4>
            <p className="text-xs text-muted font-medium">
              All product images uploaded now are stored with multi-image structure (`primary_image` + `images` array) to train & match Phase 2 AI.
            </p>
          </div>

          <Link
            to="/add"
            className="whitespace-nowrap px-6 py-3.5 bg-brand text-black font-black rounded-xl hover:scale-105 transition-all shadow-lg flex items-center gap-2"
          >
            <span>Test Camera Upload Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
