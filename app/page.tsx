'use client';

import { useState, useRef, useMemo } from 'react';
import { Upload, FileText, Loader2, CheckCircle, Briefcase, TrendingUp, Map, Award, BookOpen, Cpu, Target, AlertTriangle, AlertCircle, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls } from '@react-three/drei';
import CareerOrb from '@/components/CareerOrb';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    degreeName: { type: Type.STRING },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          grade: { type: Type.STRING }
        },
        required: ["title", "grade"]
      }
    },
    softSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          inferredFrom: { type: Type.STRING }
        },
        required: ["skill", "inferredFrom"]
      }
    },
    hiddenTechnicalSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          inferredFrom: { type: Type.STRING }
        },
        required: ["skill", "inferredFrom"]
      }
    },
    roleMatch: {
      type: Type.OBJECT,
      properties: {
        roles: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        explanation: { type: Type.STRING }
      },
      required: ["roles", "explanation"]
    },
    salaryLeap: {
      type: Type.OBJECT,
      properties: {
        currentEstimatedSalary: { type: Type.STRING },
        projectedSalary: { type: Type.STRING },
        explanation: { type: Type.STRING }
      },
      required: ["currentEstimatedSalary", "projectedSalary", "explanation"]
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.INTEGER },
          focus: { type: Type.STRING },
          certifications: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          actionItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["month", "focus", "certifications", "actionItems"]
      }
    },
    gapAnalysis: {
      type: Type.OBJECT,
      properties: {
        verifiedMatches: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        partiallyMatched: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        missingCritical: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        explanation: { type: Type.STRING }
      },
      required: ["verifiedMatches", "partiallyMatched", "missingCritical", "explanation"]
    }
  },
  required: ["degreeName", "modules", "softSkills", "hiddenTechnicalSkills", "roleMatch", "salaryLeap", "roadmap", "gapAnalysis"]
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dreamRole, setDreamRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const skillCount = result ? (result.softSkills?.length || 0) + (result.hiddenTechnicalSkills?.length || 0) + (result.gapAnalysis?.verifiedMatches?.length || 0) : 0;

  const skillsList = useMemo(() => {
    if (!result) return [];
    const skills = [];
    if (result.gapAnalysis?.verifiedMatches) skills.push(...result.gapAnalysis.verifiedMatches);
    if (result.softSkills) skills.push(...result.softSkills.map((s: any) => s.skill));
    if (result.hiddenTechnicalSkills) skills.push(...result.hiddenTechnicalSkills.map((s: any) => s.skill));
    return skills.slice(0, 15);
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please upload an image or PDF file');
      return;
    }
    setFile(file);
    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeDocument = async () => {
    if (!file || !preview) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = preview.split(',')[1];
      const mimeType = file.type;

      const systemInstruction = `You are a Malaysian CS Career Architect. Your task is to analyze an uploaded resume, transcript, or certificate and extract key information.
Use the following context as your sole source of truth for the 2026 job market:

**NSS (National Semiconductor Strategy) Context:**
- Focus areas: IC Design, Advanced Packaging, Wafer Fabrication, Semiconductor Manufacturing Equipment.
- Key initiatives: MyChipStart (IC Design startups), Advanced Packaging Technology Centre.
- Goal: Move up the value chain to high-end manufacturing and semiconductor design.

**PIKOM 2025/2026 Economic and Digital Job Market Outlook Context:**
- High-growth roles: AI engineers, Machine learning (ML) specialists, AI agent specialists, Data scientists and analysts, Data engineers and MLOps specialists, Cloud engineers and cloud architects, Cybersecurity professionals, Blockchain developers, Edge and data-centre engineers.
- Average Monthly Salaries (2025/2026 estimates):
  - Entry Level: RM 4,816 - RM 5,365
  - Junior Executive: RM 7,326 - RM 8,154
  - Senior Executive: RM 11,861 - RM 13,212
  - Manager: RM 19,347 - RM 21,812
  - Senior Manager: RM 30,668 - RM 34,075
- Specific AI/Data/Cybersecurity Annual Salaries (2025):
  - AI Engineer: RM 157,600
  - ML Engineer: RM 169,787
  - Data Scientist: RM 143,687
  - Data Engineer: RM 144,260
  - Cybersecurity Engineer: RM 172,798

**Instructions:**
1. Extract the degree name, all module titles, and grades.
2. Infer 'Soft Skills' (e.g., 'President of Club' = Leadership).
3. Infer 'Hidden Technical Skills' (e.g., 'Discrete Math' = Logic Foundations for IC Design).
4. Compare the extracted modules against the NSS and MDEC high-growth roles and suggest the best matching roles.
5. Calculate a 'Salary Leap' using the PIKOM benchmarks (estimate their starting salary based on their level, and project a future salary if they align with the high-growth roles).
6. Suggest a 3-month interactive roadmap. 
   - Month 1: Fundamentals (bridge the gap). 
   - Month 2: Project-based learning (suggest a local project, e.g., 'Build a Verilog module' or a relevant project based on their dream role and portfolio samples). 
   - Month 3: Certification & Application (link to specific MDEC or TalentCorp programs).
7. Cross-reference their extracted skills with the context and the provided 'Dream Role' (if any) to generate a 'Gap Analysis' report showing: 1) Verified matches, 2) Partially matched skills, and 3) Missing critical skills for HGHV (High Growth High Value) sectors.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data
              }
            },
            {
              text: `Analyze this document according to the system instructions.\n\nUser's Dream Role: ${dreamRole || 'Not specified, assume a high-growth role based on their profile.'}`
            }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response from Gemini");
      }

      const parsedResult = JSON.parse(text);
      setResult(parsedResult);
      if (parsedResult.roadmap && parsedResult.roadmap.length > 0) {
        setActiveMonth(parsedResult.roadmap[0].month);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-black text-white font-sans relative overflow-x-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <CareerOrb 
            skillCount={skillCount} 
            gapStatus={result?.gapStatus} 
            isGenerating={loading} 
            hasResult={!!result}
            hoveredSkill={hoveredSkill}
            skillsList={skillsList}
          />
          <OrbitControls enableZoom={false} enablePan={false} />
          <Environment preset="city" />
        </Canvas>
      </div>

      {/* UI Layer */}
      <div className={`relative z-10 flex min-h-screen pointer-events-none ${result ? 'flex-col lg:flex-row' : 'flex-col'}`}>
        {/* Orb Space */}
        <div className={`w-full pointer-events-none shrink-0 transition-all duration-1000 ${result ? 'h-[40vh] lg:h-screen lg:w-1/2' : 'h-[40vh] lg:h-[50vh]'}`}></div>
        
        {/* UI Content */}
        <div className={`w-full p-4 sm:p-8 overflow-y-auto pointer-events-auto transition-all duration-1000 ${result ? 'lg:w-1/2 lg:h-screen' : 'max-w-3xl mx-auto'}`}>
          <header className="mb-8">
            <div className="flex items-center gap-2">
              <div className="bg-amber-400 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-950" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">MY Career Architect</h1>
            </div>
            <div className="text-sm font-medium text-blue-200 mt-2">
              Powered by Gemini 3.1 Pro & PIKOM 2025 Data
            </div>
          </header>

          {!result && (
            <div className="mb-12">
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
                Unlock Your Digital Potential
              </h2>
              <p className="text-lg text-blue-200">
                Upload your transcript, certificate, or resume (Image or PDF). We'll extract your skills, match you with high-growth roles in Malaysia's digital economy, and map out your salary leap.
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div 
              className={`bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border-2 border-dashed transition-colors ${
                file ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 hover:border-white/30'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {preview ? (
                  <div className="mb-6 relative rounded-xl overflow-hidden shadow-sm border border-white/20">
                    {file?.type === 'application/pdf' ? (
                      <div className="w-full h-48 bg-white/5 flex flex-col items-center justify-center text-blue-200">
                        <FileText className="w-12 h-12 mb-2" />
                        <span className="text-sm font-medium px-4 truncate w-full">{file.name}</span>
                      </div>
                    ) : (
                      <img src={preview} alt="Preview" className="w-full h-auto max-h-64 object-contain bg-white/5" />
                    )}
                  </div>
                ) : (
                  <div className="mx-auto w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Upload className="w-10 h-10 text-blue-200" />
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-white mb-2">
                  {file ? file.name : 'Upload your document'}
                </h3>
                <p className="text-sm text-blue-200 mb-6">
                  {file ? 'Ready to analyze' : 'Drag and drop your image or PDF here, or click to browse'}
                </p>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,application/pdf" 
                  className="hidden" 
                />
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                    disabled={loading}
                  >
                    {file ? 'Change File' : 'Select File'}
                  </button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 text-red-200 text-sm rounded-lg border border-red-500/30">
                    {error}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10">
              <label htmlFor="dreamRole" className="block text-sm font-medium text-blue-100 mb-2">
                Your Dream Role in 2026 Malaysia (Optional)
              </label>
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="text"
                  id="dreamRole"
                  className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/20 rounded-xl focus:ring-amber-500 focus:border-amber-500 sm:text-sm text-white placeholder-blue-300"
                  placeholder="e.g. AI Engineer, IC Design Engineer"
                  value={dreamRole}
                  onChange={(e) => setDreamRole(e.target.value)}
                  disabled={loading}
                />
              </div>

              <button 
                onClick={analyzeDocument}
                disabled={loading || !file}
                className="w-full px-6 py-3 bg-amber-500 text-blue-950 font-bold rounded-xl hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Profile...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    Generate Career Blueprint
                  </>
                )}
              </button>
            </div>

            {result && (
              <div className="space-y-6 pb-12">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">Your Career Blueprint</h2>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-blue-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-xl flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-200 uppercase tracking-wider">Detected Qualification</h3>
                      <p className="text-xl font-bold text-white">{result.degreeName || 'Unknown Degree'}</p>
                    </div>
                  </div>
                </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-amber-500" />
                  Gap Analysis for {dreamRole || 'High-Growth Roles'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <h4 className="font-semibold text-emerald-800 flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4" />
                      Verified Matches
                    </h4>
                    <ul className="space-y-2">
                      {result.gapAnalysis?.verifiedMatches?.map((match: string, i: number) => (
                        <li 
                          key={i} 
                          className="text-sm text-emerald-400 flex items-start gap-2 cursor-pointer transition-colors hover:text-emerald-300"
                          onMouseEnter={() => setHoveredSkill(match)}
                          onMouseLeave={() => setHoveredSkill(null)}
                        >
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          {match}
                        </li>
                      ))}
                      {(!result.gapAnalysis?.verifiedMatches || result.gapAnalysis.verifiedMatches.length === 0) && (
                        <li className="text-sm text-emerald-600/70 italic">No verified matches found.</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                    <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4" />
                      Partial Matches
                    </h4>
                    <ul className="space-y-2">
                      {result.gapAnalysis?.partiallyMatched?.map((match: string, i: number) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {match}
                        </li>
                      ))}
                      {(!result.gapAnalysis?.partiallyMatched || result.gapAnalysis.partiallyMatched.length === 0) && (
                        <li className="text-sm text-amber-600/70 italic">No partial matches found.</li>
                      )}
                    </ul>
                  </div>
                  
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                    <h4 className="font-semibold text-rose-800 flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      Missing Critical Skills
                    </h4>
                    <ul className="space-y-2">
                      {result.gapAnalysis?.missingCritical?.map((match: string, i: number) => (
                        <li key={i} className="text-sm text-rose-700 flex items-start gap-2">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                          {match}
                        </li>
                      ))}
                      {(!result.gapAnalysis?.missingCritical || result.gapAnalysis.missingCritical.length === 0) && (
                        <li className="text-sm text-rose-600/70 italic">No missing critical skills identified.</li>
                      )}
                    </ul>
                  </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-xl text-sm text-blue-100 border border-white/10">
                  <span className="font-semibold text-white">Analysis: </span>
                  {result.gapAnalysis?.explanation}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-amber-500" />
                    Inferred Soft Skills
                  </h3>
                  <ul className="space-y-3">
                    {result.softSkills?.map((skill: any, i: number) => (
                      <li key={i} className="flex flex-col">
                        <span className="font-semibold text-blue-100">{skill.skill}</span>
                        <span className="text-sm text-blue-300">From: {skill.inferredFrom}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
                >
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-amber-500" />
                    Hidden Technical Skills
                  </h3>
                  <ul className="space-y-3">
                    {result.hiddenTechnicalSkills?.map((skill: any, i: number) => (
                      <li key={i} className="flex flex-col">
                        <span className="font-semibold text-blue-100">{skill.skill}</span>
                        <span className="text-sm text-blue-300">From: {skill.inferredFrom}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl text-white border border-white/10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-amber-400" />
                      NSS / MDEC Role Match
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {result.roleMatch?.roles?.map((role: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-900/50 text-amber-300 rounded-full text-sm font-medium border border-amber-500/30">
                          {role}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      {result.roleMatch?.explanation}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-400" />
                      Salary Leap Projection
                    </h3>
                    <div className="bg-blue-900/50 rounded-xl p-4 border border-blue-800 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-blue-200 text-sm">Current Est.</span>
                        <span className="font-mono font-medium text-white">{result.salaryLeap?.currentEstimatedSalary}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400 font-medium">Projected Leap</span>
                        <span className="font-mono font-bold text-amber-400 text-xl">{result.salaryLeap?.projectedSalary}</span>
                      </div>
                    </div>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      {result.salaryLeap?.explanation}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
              >
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Map className="w-6 h-6 text-amber-500" />
                  3-Month Interactive Roadmap
                </h3>
                
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3 border-l-2 border-white/20 pl-4 space-y-6">
                    {result.roadmap?.map((step: any, i: number) => (
                      <div 
                        key={i} 
                        className={`relative cursor-pointer transition-all ${activeMonth === step.month ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                        onClick={() => setActiveMonth(step.month)}
                      >
                        <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${activeMonth === step.month ? 'bg-amber-500 ring-4 ring-amber-500/30' : 'bg-white/30'}`} />
                        <h4 className={`text-sm font-bold ${activeMonth === step.month ? 'text-amber-400' : 'text-blue-200'}`}>Month {step.month}</h4>
                        <p className="text-base font-semibold text-white">{step.focus}</p>
                      </div>
                    ))}
                  </div>

                  <div className="md:w-2/3 bg-white/5 rounded-2xl p-6 border border-white/10">
                    {result.roadmap?.filter((s: any) => s.month === activeMonth).map((step: any, i: number) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-blue-500/20 p-2 rounded-lg text-blue-300">
                            {step.month === 1 ? <BookOpen className="w-5 h-5" /> : 
                             step.month === 2 ? <Cpu className="w-5 h-5" /> : 
                             <Award className="w-5 h-5" />}
                          </div>
                          <h4 className="text-xl font-bold text-white">{step.focus}</h4>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">Action Items</h5>
                            <ul className="space-y-2">
                              {step.actionItems?.map((item: string, j: number) => (
                                <li key={j} className="flex items-start gap-2 text-blue-100">
                                  <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {step.certifications && step.certifications.length > 0 && (
                            <div>
                              <h5 className="text-sm font-semibold text-blue-300 uppercase tracking-wider mb-2">Programs / Certifications</h5>
                              <div className="flex flex-wrap gap-2">
                                {step.certifications.map((cert: string, j: number) => (
                                  <span key={j} className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-lg text-sm font-medium shadow-sm">
                                    <Award className="w-4 h-4 text-amber-500" />
                                    {cert}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/10"
              >
                <h3 className="text-lg font-bold text-white mb-4">Extracted Modules</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-blue-200 font-medium border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Module Title</th>
                        <th className="px-4 py-3 rounded-tr-lg w-24">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {result.modules?.map((mod: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-blue-100">{mod.title}</td>
                          <td className="px-4 py-3 text-white font-medium">{mod.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
