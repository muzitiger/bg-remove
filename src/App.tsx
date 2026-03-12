import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Images } from "./components/Images";
import { BeforeAfterSlider } from "./components/BeforeAfterSlider";
import { processImages, initializeModel, getModelInfo } from "../lib/process";

interface AppError {
  message: string;
}

export interface ImageFile {
  id: number;
  file: File;
  processedFile?: File;
}

const sampleImages = [
  "images/hero.png",
  "images/生成图片.png",
  "images/生成图片 (1).png",
  "images/【哲风壁纸】御姐风-蓝色系美女.png",
];

const isMobileSafari = () => {
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i) && !ua.match(/OPiOS/i) && !ua.match(/FxiOS/i);
  return iOSSafari && "ontouchend" in document;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);
  const [isWebGPU, setIsWebGPU] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [currentModel, setCurrentModel] = useState<"briaai/RMBG-1.4" | "Xenova/modnet">("briaai/RMBG-1.4");
  const [isModelSwitching, setIsModelSwitching] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);

  useEffect(() => {
    if (isMobileSafari()) {
      window.location.href = "https://bg-mobile.addy.ie";
      return;
    }
    const { isIOS: isIOSDevice } = getModelInfo();
    setIsIOS(isIOSDevice);
    setIsLoading(false);
  }, []);

  const handleModelChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = event.target.value as typeof currentModel;
    setIsModelSwitching(true);
    setError(null);
    try {
      const initialized = await initializeModel(newModel);
      if (!initialized) throw new Error("Failed to initialize new model");
      setCurrentModel(newModel);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Falling back")) {
        setCurrentModel("briaai/RMBG-1.4");
      } else {
        setError({ message: err instanceof Error ? err.message : "Failed to switch models" });
      }
    } finally {
      setIsModelSwitching(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      processedFile: undefined,
    }));
    setImages((prev) => [...prev, ...newImages]);

    if (images.length === 0) {
      setIsLoading(true);
      setError(null);
      try {
        const initialized = await initializeModel();
        if (!initialized) throw new Error("Failed to initialize background removal model");
        const { isWebGPUSupported } = getModelInfo();
        setIsWebGPU(isWebGPUSupported);
      } catch (err) {
        setError({ message: err instanceof Error ? err.message : "An unknown error occurred" });
        setImages([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }

    for (const image of newImages) {
      try {
        const result = await processImages([image.file]);
        if (result && result.length > 0) {
          setImages((prev) =>
            prev.map((img) => (img.id === image.id ? { ...img, processedFile: result[0] } : img))
          );
        }
      } catch (error) {
        console.error("Error processing image:", error);
      }
    }
  }, [images.length]);

  const handlePaste = async (event: React.ClipboardEvent) => {
    const clipboardItems = event.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of clipboardItems) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) onDrop(imageFiles);
  };

  const handleSampleImageClick = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], "sample-image.jpg", { type: "image/jpeg" });
      onDrop([file]);
    } catch (error) {
      console.error("Error loading sample image:", error);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
  });

  const hasImages = images.length > 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light text-slate-900 font-display" onPaste={handlePaste}>
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass-effect border-b border-slate-200 px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900">PureCut</h2>
          </div>
          {!hasImages && (
            <nav className="hidden md:flex items-center gap-10">
              <a className="text-sm font-semibold hover:text-primary transition-colors" href="#features">Features</a>
              <a className="text-sm font-semibold hover:text-primary transition-colors" href="#how-it-works">How it Works</a>
              <a className="text-sm font-semibold hover:text-primary transition-colors" href="#security">Security</a>
            </nav>
          )}
          <div className="flex items-center gap-4">
            {!isIOS && hasImages && (
              <select
                value={currentModel}
                onChange={handleModelChange}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 cursor-pointer appearance-none"
                disabled={!isWebGPU}
              >
                <option value="briaai/RMBG-1.4">RMBG-1.4 (Cross-browser)</option>
                {isWebGPU && <option value="Xenova/modnet">MODNet (WebGPU)</option>}
              </select>
            )}
            {!hasImages && (
              <button
                {...getRootProps()}
                className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── When images exist: show editor view ─── */}
        {hasImages && (
          <section className="max-w-7xl mx-auto px-6 lg:px-20 py-8 sm:py-12">
            <Images images={images} onDelete={(id) => setImages((prev) => prev.filter((img) => img.id !== id))} />
            {/* Compact add-more dropzone */}
            <div
              {...getRootProps()}
              className={`mt-4 p-4 border-2 border-dashed rounded-xl text-center cursor-pointer group
                ${isDragAccept ? "border-green-500 bg-green-50" : ""}
                ${isDragReject ? "border-red-500 bg-red-50" : ""}
                ${isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary/40 hover:bg-primary/5"}
              `}
            >
              <input {...getInputProps()} className="hidden" />
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-xl text-slate-400 group-hover:text-primary">add</span>
                <span className="text-sm text-slate-500 group-hover:text-slate-700">Add more images</span>
              </div>
            </div>
          </section>
        )}

        {/* ─── Landing page: when no images ─── */}
        {!hasImages && (
          <>
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-6 lg:px-20 py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="flex flex-col gap-8">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full w-fit">
                    <span className="material-symbols-outlined text-sm">shield_lock</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Local &amp; Secure ML</span>
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900">
                      Professional Background Removal <span className="text-primary">in Seconds</span>
                    </h1>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                      Powered by Transformers.js. Remove backgrounds directly in your browser. No server uploads, no privacy risks—just pure, high-quality cutouts.
                    </p>
                  </div>

                  {/* Upload Area */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                    <div
                      {...getRootProps()}
                      className={`relative flex flex-col items-center justify-center border-2 border-dashed bg-white rounded-2xl p-10 transition-all
                        ${isDragAccept ? "border-green-500 bg-green-50" : ""}
                        ${isDragReject ? "border-red-500 bg-red-50" : ""}
                        ${isDragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary"}
                        ${isLoading || isModelSwitching ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                      `}
                    >
                      <input {...getInputProps()} className="hidden" disabled={isLoading || isModelSwitching} />
                      {isLoading || isModelSwitching ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-primary/30 border-t-primary mb-4"></div>
                          <p className="text-base text-slate-500">
                            {isModelSwitching ? "Switching models..." : "Loading background removal model..."}
                          </p>
                        </>
                      ) : error ? (
                        <>
                          <span className="material-symbols-outlined text-5xl text-red-500 mb-4">warning</span>
                          <p className="text-base text-red-600 font-medium mb-1">{error.message}</p>
                          {currentModel === "Xenova/modnet" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleModelChange({ target: { value: "briaai/RMBG-1.4" } } as any);
                              }}
                              className="mt-3 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90"
                            >
                              Switch to Cross-browser Version
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-5xl text-primary mb-4">cloud_upload</span>
                          <h3 className="text-lg font-bold mb-1">Drag and drop image</h3>
                          <p className="text-sm text-slate-500 mb-6 text-center">Supports JPG, PNG, WEBP up to 10MB</p>
                          <span className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform inline-block">
                            Browse Files
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hero comparison slider */}
                <BeforeAfterSlider
                  beforeSrc="images/hero.png"
                  afterSrc="images/hero-nobg.png"
                  beforeLabel="Before"
                  afterLabel="After"
                />
              </div>
            </section>

            {/* Stats/Trust Section */}
            <section className="bg-white py-12 border-y border-slate-200" id="security">
              <div className="max-w-7xl mx-auto px-6 lg:px-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex items-center gap-4 p-6 rounded-2xl bg-background-light">
                    <span className="material-symbols-outlined text-3xl text-primary">security</span>
                    <div>
                      <h4 className="font-bold">100% Private</h4>
                      <p className="text-sm text-slate-500">Processing happens on your device</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 rounded-2xl bg-background-light">
                    <span className="material-symbols-outlined text-3xl text-primary">bolt</span>
                    <div>
                      <h4 className="font-bold">Ultra Fast</h4>
                      <p className="text-sm text-slate-500">Optimized Transformers.js models</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 rounded-2xl bg-background-light">
                    <span className="material-symbols-outlined text-3xl text-primary">high_quality</span>
                    <div>
                      <h4 className="font-bold">Pro Quality</h4>
                      <p className="text-sm text-slate-500">Precise edge detection for any image</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works */}
            <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24" id="how-it-works">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-5xl font-black mb-4">Magic in 3 Simple Steps</h2>
                <p className="text-slate-600">PureCut makes pro-level editing accessible to everyone.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-12">
                {[
                  { icon: "upload_file", title: "1. Upload", desc: "Drag or click to select the image you want to edit. No account needed." },
                  { icon: "memory", title: "2. Auto-Process", desc: "Our local AI instantly detects the subject and removes the background." },
                  { icon: "download", title: "3. Download", desc: "Save your high-resolution PNG with transparency instantly." },
                ].map((step, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center group">
                    <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-slate-600">{step.desc}</p>
                    {i < 2 && (
                      <div className="hidden md:block absolute top-8 -right-6 text-slate-200">
                        <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Sample images */}
            <section className="max-w-7xl mx-auto px-6 lg:px-20 pb-16">
              <div className="bg-white rounded-2xl p-6 shadow-card">
                <h3 className="text-base font-medium mb-4">No image? Try one of these</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sampleImages.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleImageClick(url)}
                      className="relative aspect-square overflow-hidden rounded-xl group focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2"
                    >
                      <img src={url} alt={`Sample ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-xl" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  All images are processed locally on your device
                </p>
              </div>
            </section>

            {/* Features Bento Grid */}
            <section className="bg-slate-900 text-white py-24 overflow-hidden" id="features">
              <div className="max-w-7xl mx-auto px-6 lg:px-20">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 p-10 rounded-3xl bg-primary/20 border border-primary/30 flex flex-col justify-between">
                    <div>
                      <h3 className="text-3xl font-bold mb-4">Privacy by Design</h3>
                      <p className="text-lg text-slate-300 max-w-lg">
                        Unlike other tools, PureCut doesn't upload your images to any server. All the heavy lifting is done right in your browser using Transformers.js.
                      </p>
                    </div>
                    <div className="mt-8 flex gap-4">
                      <div className="bg-white/10 p-4 rounded-xl backdrop-blur">
                        <span className="material-symbols-outlined text-2xl text-primary">visibility_off</span>
                        <p className="text-xs mt-2 font-bold uppercase tracking-tighter">Zero Tracking</p>
                      </div>
                      <div className="bg-white/10 p-4 rounded-xl backdrop-blur">
                        <span className="material-symbols-outlined text-2xl text-primary">encrypted</span>
                        <p className="text-xs mt-2 font-bold uppercase tracking-tighter">On-device ML</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-10 rounded-3xl bg-slate-800 border border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-primary mb-6">workspace_premium</span>
                    <h3 className="text-2xl font-bold mb-4">Unlimited Exports</h3>
                    <p className="text-slate-400">No credits, no subscription limits. Export as many high-res images as you need for free.</p>
                  </div>
                  <div className="p-10 rounded-3xl bg-slate-800 border border-slate-700">
                    <span className="material-symbols-outlined text-4xl text-primary mb-6">speed</span>
                    <h3 className="text-2xl font-bold mb-4">GPU Accelerated</h3>
                    <p className="text-slate-400">Leverages WebGPU if available for near-instant processing speeds on modern hardware.</p>
                  </div>
                  <div className="lg:col-span-2 p-10 rounded-3xl bg-primary flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                      <h3 className="text-3xl font-bold mb-4">Ready to try it?</h3>
                      <p className="text-blue-100/80 mb-8">Join thousands of users making their photos professional.</p>
                      <button
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="bg-white text-primary px-8 py-4 rounded-xl font-black hover:scale-105 transition-transform"
                      >
                        Launch Editor
                      </button>
                    </div>
                    <div className="hidden md:block absolute -right-10 opacity-20 transform rotate-12 group-hover:rotate-6 transition-transform">
                      <span className="material-symbols-outlined text-[200px]">auto_fix_high</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-background-light border-t border-slate-200 pt-16 pb-8 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary p-1.5 rounded-lg text-white">
                  <span className="material-symbols-outlined">auto_fix_high</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">PureCut</h2>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                Privacy-focused AI background removal tool that runs entirely in your browser. No data leaves your machine.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a className="hover:text-primary transition-colors" href="#how-it-works">How it Works</a></li>
                <li><a className="hover:text-primary transition-colors" href="#features">Features</a></li>
                <li><a className="hover:text-primary transition-colors" href="#security">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Technical</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a className="hover:text-primary transition-colors" href="https://huggingface.co/docs/transformers.js" target="_blank" rel="noopener noreferrer">Transformers.js</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Github</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-slate-200 gap-4">
            <p className="text-xs text-slate-500">© 2024 PureCut. Built with modern ML technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
