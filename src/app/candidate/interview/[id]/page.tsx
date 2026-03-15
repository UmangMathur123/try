"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  type: "ai" | "user" | "score" | "system";
  text: string;
  scores?: { relevanceScore: number; clarityScore: number; depthScore: number; correctnessScore: number; totalScore: number; feedback: string };
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [candidateSkills, setCandidateSkills] = useState<string[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [questionNum, setQuestionNum] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [finalScores, setFinalScores] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [proctoringActive, setProctoringActive] = useState(false);

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceConfidence, setVoiceConfidence] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Proctoring states
  const [faceCount, setFaceCount] = useState(0);
  const [eyeStatus, setEyeStatus] = useState<"focused" | "away">("focused");
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [cameraOff, setCameraOff] = useState(false);
  const [cameraOffTimer, setCameraOffTimer] = useState(0);
  const [proctoringStats, setProctoringStats] = useState({ faces: 0, noFace: 0, noise: 0, eyeAway: 0 });

  const messagesEnd = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const noFaceStartRef = useRef<number | null>(null);
  const faceDetectionIntervalRef = useRef<any>(null);
  const noiseDetectionIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ============ TEXT-TO-SPEECH ============
  const speakText = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      // Try to get a good English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                           voices.find(v => v.lang.startsWith('en')) ||
                           voices[0];
      if (englishVoice) utterance.voice = englishVoice;
      
      setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ============ SPEECH-TO-TEXT ============
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceSupported(false); return; }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let finalTranscript = '';
    let confidenceSum = 0;
    let confidenceCount = 0;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
          confidenceSum += result[0].confidence;
          confidenceCount++;
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
      setInput(finalTranscript + interim);
      if (confidenceCount > 0) {
        setVoiceConfidence(Math.round((confidenceSum / confidenceCount) * 100));
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
    setInput('');
    setVoiceConfidence(0);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ============ FACE DETECTION (Canvas-based simple detection) ============
  const startFaceDetection = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    faceDetectionIntervalRef.current = setInterval(() => {
      if (!video || video.readyState < 2) return;

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Skin color detection for face presence
      let skinPixels = 0;
      let totalPixels = 0;
      const skinRegions: { x: number; y: number }[] = [];
      const step = 4; // sample every 4th pixel for performance

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          totalPixels++;

          // Skin color detection using RGB rules
          if (r > 95 && g > 40 && b > 20 &&
              r > g && r > b &&
              (r - g) > 15 &&
              Math.abs(r - g) > 15 &&
              r - b > 15) {
            skinPixels++;
            skinRegions.push({ x, y });
          }
        }
      }

      const skinRatio = skinPixels / totalPixels;

      if (skinRatio < 0.02) {
        // No face detected
        setFaceCount(0);
        setCameraOff(true);

        if (!noFaceStartRef.current) {
          noFaceStartRef.current = Date.now();
        } else {
          const elapsed = (Date.now() - noFaceStartRef.current) / 1000;
          setCameraOffTimer(Math.floor(elapsed));
          if (elapsed > 5) {
            // Camera off for more than 5 seconds
            setProctoringStats(prev => ({ ...prev, noFace: prev.noFace + 1 }));
            noFaceStartRef.current = Date.now(); // Reset to flag again after another 5s
          }
        }
      } else {
        noFaceStartRef.current = null;
        setCameraOff(false);
        setCameraOffTimer(0);

        // Cluster skin pixels to detect number of faces
        if (skinRegions.length > 0) {
          const clusters = clusterRegions(skinRegions, canvas.width * 0.2);
          const faceClusterCount = clusters.filter(c => c.count > 10).length;
          setFaceCount(faceClusterCount);

          if (faceClusterCount >= 2) {
            setProctoringStats(prev => ({ ...prev, faces: prev.faces + 1 }));
          }
        } else {
          setFaceCount(1);
        }

        // Simple eye gaze approximation: if skin concentration is off-center
        if (skinRegions.length > 20) {
          const avgX = skinRegions.reduce((s, p) => s + p.x, 0) / skinRegions.length;
          const centerX = canvas.width / 2;
          const deviation = Math.abs(avgX - centerX) / centerX;
          if (deviation > 0.4) {
            setEyeStatus("away");
            setProctoringStats(prev => ({ ...prev, eyeAway: prev.eyeAway + 1 }));
          } else {
            setEyeStatus("focused");
          }
        }
      }
    }, 2000);
  }, []);

  // Simple clustering algorithm for face detection
  const clusterRegions = (points: { x: number; y: number }[], threshold: number) => {
    const clusters: { x: number; y: number; count: number }[] = [];
    for (const point of points) {
      let added = false;
      for (const cluster of clusters) {
        const dist = Math.sqrt(Math.pow(point.x - cluster.x, 2) + Math.pow(point.y - cluster.y, 2));
        if (dist < threshold) {
          cluster.x = (cluster.x * cluster.count + point.x) / (cluster.count + 1);
          cluster.y = (cluster.y * cluster.count + point.y) / (cluster.count + 1);
          cluster.count++;
          added = true;
          break;
        }
      }
      if (!added) {
        clusters.push({ ...point, count: 1 });
      }
    }
    return clusters;
  };

  // ============ NOISE DETECTION ============
  const startNoiseDetection = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      noiseDetectionIntervalRef.current = setInterval(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round(average * 1.5));
        setNoiseLevel(normalizedLevel);

        if (normalizedLevel > 60) {
          setProctoringStats(prev => ({ ...prev, noise: prev.noise + 1 }));
        }
      }, 1500);
    } catch (err) {
      console.error('Noise detection error:', err);
    }
  }, []);

  // ============ TAB VISIBILITY ============
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && interviewId && !completed) {
        setTabWarnings(w => w + 1);
        fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, type: "TAB_SWITCH", details: "Candidate switched to another tab" }),
        });
        addMessage("system", "⚠️ Tab switch detected! This has been flagged.");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [interviewId, completed]);

  // ============ WEBCAM + PROCTORING SETUP ============
  useEffect(() => {
    if (interviewId && !completed) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: true }).then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setProctoringActive(true);
        }
        // Start noise detection with audio track
        startNoiseDetection(stream);
        // Start face detection
        setTimeout(() => startFaceDetection(), 1000);
      }).catch(() => {
        addMessage("system", "📷 Camera/mic access denied. Proctoring and voice features will be limited.");
        setProctoringActive(false);
      });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
      if (noiseDetectionIntervalRef.current) clearInterval(noiseDetectionIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
    };
  }, [interviewId, completed, startNoiseDetection, startFaceDetection]);

  // ============ SEND PROCTORING FLAGS ============
  useEffect(() => {
    if (!interviewId || completed) return;

    const sendFlags = async () => {
      if (proctoringStats.faces > 3) {
        await fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, type: "MULTIPLE_FACES", details: `Multiple people detected (${faceCount} faces)` }),
        });
        addMessage("system", "⚠️ Multiple people detected! Marks will be reduced.");
        setProctoringStats(prev => ({ ...prev, faces: 0 }));
      }

      if (proctoringStats.noFace > 0) {
        await fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, type: "NO_FACE", details: "Camera off for more than 5 seconds" }),
        });
        addMessage("system", "⚠️ Camera was off for more than 5 seconds! Marks will be reduced.");
        setProctoringStats(prev => ({ ...prev, noFace: 0 }));
      }

      if (proctoringStats.noise > 5) {
        await fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, type: "BACKGROUND_NOISE", details: "High ambient noise detected" }),
        });
        addMessage("system", "⚠️ Too much noise detected in the environment! Marks will be reduced.");
        setProctoringStats(prev => ({ ...prev, noise: 0 }));
      }

      if (proctoringStats.eyeAway > 5) {
        await fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ interviewId, type: "LOOKING_AWAY", details: "Candidate looking away from screen" }),
        });
        addMessage("system", "⚠️ Please look at the screen during the interview.");
        setProctoringStats(prev => ({ ...prev, eyeAway: 0 }));
      }
    };

    const interval = setInterval(sendFlags, 5000);
    return () => clearInterval(interval);
  }, [interviewId, completed, proctoringStats, faceCount]);

  // ============ LOAD VOICES ============
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // ============ CHECK / START INTERVIEW ============
  useEffect(() => {
    const checkInterview = async () => {
      try {
        const res = await fetch(`/api/interview?applicationId=${applicationId}`);
        const data = await res.json();
        if (data.interview?.status === "COMPLETED") {
          setCompleted(true);
          setInterviewId(data.interview.id);
          setJobTitle(data.interview.application.job.title);
          const msgs: Message[] = [];
          for (const q of data.interview.questions) {
            msgs.push({ id: `q-${q.id}`, type: "ai", text: q.text });
            if (q.response) {
              msgs.push({ id: `a-${q.id}`, type: "user", text: q.response.answerText });
              msgs.push({
                id: `s-${q.id}`, type: "score", text: q.response.aiEvaluation,
                scores: { relevanceScore: q.response.relevanceScore, clarityScore: q.response.clarityScore, depthScore: q.response.depthScore, correctnessScore: q.response.correctnessScore, totalScore: q.response.totalScore, feedback: q.response.aiEvaluation }
              });
            }
          }
          setMessages(msgs);
          setFinalScores({
            resumeMatch: data.interview.application?.resumeMatchScore || 0,
            technical: data.interview.technicalScore,
            communication: data.interview.communicationScore,
            integrity: data.interview.integrityScore,
            overall: data.interview.overallScore,
            status: data.interview.overallScore >= 70 ? "SHORTLISTED" : "REJECTED",
          });
          setLoading(false);
          return;
        }
      } catch {}
      startInterview();
    };
    checkInterview();
  }, [applicationId]);

  const addMessage = (type: Message["type"], text: string, scores?: Message["scores"]) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), type, text, scores }]);
  };

  const startInterview = async () => {
    try {
      setTyping(true);
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", applicationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setInterviewId(data.interview.id);
      setJobTitle(data.jobTitle);
      setJobDescription(data.jobDescription);
      setCandidateSkills(data.candidateSkills);
      setPlan(data.plan);
      setCurrentQuestionId(data.question.id);
      setQuestionNum(1);

      addMessage("system", `🎯 Voice Interview for "${data.jobTitle}" is starting. The AI will speak each question — use the microphone to answer. Good luck!`);
      
      const questionText = `Hello! Welcome to your interview for the ${data.jobTitle} position. I'll be asking you a series of questions to understand your skills and experience. Let's begin.\n\n${data.question.text}`;
      
      setTimeout(async () => {
        addMessage("ai", questionText);
        setTyping(false);
        setLoading(false);
        // AI speaks the question
        await speakText(`Welcome to your interview for the ${data.jobTitle} position. Let's begin. ${data.question.text}`);
      }, 1000);
    } catch (err: any) {
      addMessage("system", `❌ ${err.message}`);
      setTyping(false);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const answer = input.trim();
    if (!answer || sending || !currentQuestionId) return;

    // Stop listening if active
    stopListening();

    setInput("");
    setTranscript("");
    setSending(true);
    addMessage("user", answer);

    try {
      setTyping(true);
      const evalRes = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "evaluate", 
          questionId: currentQuestionId, 
          answer, 
          candidateSkills, 
          jobTitle,
          voiceConfidence: voiceConfidence / 100 // normalize to 0-1
        }),
      });
      const evalData = await evalRes.json();

      if (evalData.evaluation) {
        addMessage("score", evalData.evaluation.feedback, evalData.evaluation);
      }

      // Get next question
      const nextRes = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "next_question", interviewId, jobTitle, jobDescription, candidateSkills }),
      });
      const nextData = await nextRes.json();

      if (nextData.completed) {
        const completeRes = await fetch("/api/interview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", interviewId }),
        });
        const completeData = await completeRes.json();

        setCompleted(true);
        setFinalScores(completeData.scores);
        addMessage("system", "✅ Interview completed! Here are your results:");
        setTyping(false);

        // Stop all proctoring
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
        if (noiseDetectionIntervalRef.current) clearInterval(noiseDetectionIntervalRef.current);
        window.speechSynthesis?.cancel();
      } else {
        setCurrentQuestionId(nextData.question.id);
        setQuestionNum(nextData.currentIndex + 1);
        setPlan(nextData.plan);

        setTimeout(async () => {
          addMessage("ai", nextData.question.text);
          setTyping(false);
          // AI speaks the next question
          await speakText(nextData.question.text);
        }, 800);
      }
    } catch (err: any) {
      addMessage("system", `❌ Error: ${err.message}`);
      setTyping(false);
    } finally {
      setSending(false);
      setVoiceConfidence(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (isSpeaking) return; // Don't listen while AI is speaking
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">⚡ HireIQ</Link>
          <div className="navbar-links">
            <Link href="/candidate/dashboard" className="navbar-link">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="chat-container">
          <div className="chat-header">
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {jobTitle ? `🎤 Voice Interview: ${jobTitle}` : "🎤 AI Voice Interview"}
              </h2>
              {plan && !completed && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Q{questionNum}/{plan.totalQuestions}</span>
                  <div className="progress-container" style={{ width: 150 }}>
                    <div className="progress-bar" style={{ width: `${(questionNum / plan.totalQuestions) * 100}%` }} />
                  </div>
                  {isSpeaking && <span className="badge badge-primary" style={{ animation: "pulse 1.5s infinite" }}>🔊 AI Speaking...</span>}
                  {isListening && <span className="badge badge-success" style={{ animation: "pulse 1.5s infinite" }}>🎙️ Listening...</span>}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {tabWarnings > 0 && (
                <span className="badge badge-error">⚠️ {tabWarnings} tab switch{tabWarnings > 1 ? "es" : ""}</span>
              )}
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg) => {
              if (msg.type === "system") {
                return (
                  <div key={msg.id} style={{ textAlign: "center", padding: "8px 16px", fontSize: "0.83rem", color: "var(--text-muted)", animation: "fadeIn 0.3s ease" }}>
                    {msg.text}
                  </div>
                );
              }
              if (msg.type === "score" && msg.scores) {
                return (
                  <div key={msg.id} className="chat-message ai" style={{ maxWidth: "90%" }}>
                    <div className="chat-avatar">📊</div>
                    <div>
                      <div className="score-card">
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: 8 }}>Response Evaluation</div>
                        {[
                          { label: "Relevance", value: msg.scores.relevanceScore },
                          { label: "Clarity", value: msg.scores.clarityScore },
                          { label: "Depth", value: msg.scores.depthScore },
                          { label: "Correctness", value: msg.scores.correctnessScore },
                        ].map((s) => (
                          <div key={s.label} className="score-row">
                            <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="score-bar-container">
                                <div className="score-bar" style={{ width: `${s.value * 10}%` }} />
                              </div>
                              <span style={{ fontWeight: 600, minWidth: 28 }}>{s.value}</span>
                            </div>
                          </div>
                        ))}
                        <div className="divider" style={{ margin: "8px 0" }} />
                        <div className="score-row">
                          <span style={{ fontWeight: 600 }}>Overall</span>
                          <span style={{ fontWeight: 700, background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{msg.scores.totalScore}/10</span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 8 }}>{msg.scores.feedback}</p>
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div key={msg.id} className={`chat-message ${msg.type}`}>
                  <div className="chat-avatar">{msg.type === "ai" ? "🤖" : "👤"}</div>
                  <div className="chat-bubble" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
              );
            })}

            {typing && (
              <div className="chat-message ai">
                <div className="chat-avatar">🤖</div>
                <div className="chat-bubble"><div className="typing-indicator"><div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" /></div></div>
              </div>
            )}

            {finalScores && (
              <div className="animate-scale-in" style={{ margin: "16px 0", padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16 }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div className="score-circle" style={{ margin: "0 auto 12px", background: "var(--bg-secondary)" }}>
                    {Math.round(finalScores.overall)}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>Final Score: {Math.round(finalScores.overall)}%</div>
                  <span className={`badge ${finalScores.status === "SHORTLISTED" ? "badge-success" : "badge-error"}`} style={{ marginTop: 8, display: "inline-flex" }}>
                    {finalScores.status === "SHORTLISTED" ? "🎉 Shortlisted!" : "Not Shortlisted"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Resume Match", value: `${Math.round(finalScores.resumeMatch)}%`, color: "#7c5cfc" },
                    { label: "Technical", value: `${Math.round(finalScores.technical * 10)}%`, color: "#5b8af5" },
                    { label: "Communication", value: `${Math.round(finalScores.communication * 10)}%`, color: "#3ecfcf" },
                    { label: "Integrity", value: `${Math.round(finalScores.integrity)}%`, color: "#34d399" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: 12, background: "var(--bg-secondary)", borderRadius: 8, textAlign: "center" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Link href="/candidate/dashboard" className="btn btn-primary">Back to Dashboard</Link>
                </div>
              </div>
            )}

            <div ref={messagesEnd} />
          </div>

          {/* Voice Input Area */}
          {!completed && !loading && (
            <div className="voice-input-area">
              {/* Voice confidence meter */}
              {voiceConfidence > 0 && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginBottom: 4 }}>
                  Voice Clarity: <span style={{ color: voiceConfidence > 70 ? "var(--success)" : voiceConfidence > 40 ? "var(--warning)" : "var(--error)", fontWeight: 600 }}>{voiceConfidence}%</span>
                </div>
              )}
              
              {/* Live transcript */}
              {(isListening || transcript) && (
                <div className="voice-transcript">
                  {transcript || "🎙️ Listening... Speak now"}
                </div>
              )}

              <div className="voice-controls">
                {/* Text fallback input */}
                <textarea
                  className="chat-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={voiceSupported ? "Or type your answer here..." : "Type your answer..."}
                  disabled={sending || typing || isSpeaking}
                  rows={2}
                />

                <div style={{ display: "flex", gap: 8 }}>
                  {/* Mic Button */}
                  {voiceSupported && (
                    <button 
                      className={`mic-button ${isListening ? "mic-active" : ""}`}
                      onClick={toggleListening}
                      disabled={sending || typing || isSpeaking}
                      title={isListening ? "Stop listening" : "Start speaking"}
                    >
                      {isListening ? (
                        <span className="mic-pulse">⬛</span>
                      ) : (
                        "🎙️"
                      )}
                    </button>
                  )}

                  {/* Send Button */}
                  <button className="btn btn-primary" onClick={handleSend} disabled={sending || typing || !input.trim() || isSpeaking}>
                    {sending ? "..." : "Send ➤"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for face detection */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Enhanced Proctoring Overlay */}
      {interviewId && !completed && (
        <div className="proctor-overlay">
          <div className={`proctor-video ${(faceCount >= 2 || cameraOff) ? "proctor-warning" : ""}`}>
            <video ref={videoRef} autoPlay muted playsInline />
          </div>
          
          {/* Proctoring Status Panel */}
          <div className="proctor-panel">
            <div className="proctor-status">
              <div className="proctor-dot" style={{ background: proctoringActive ? "var(--success)" : "var(--error)" }} />
              {proctoringActive ? "Proctoring Active" : "No Camera"}
            </div>

            {/* Face Detection Status */}
            <div className="proctor-indicator">
              <span>{faceCount === 0 ? "😶" : faceCount === 1 ? "👤" : "👥"}</span>
              <span style={{ color: faceCount === 1 ? "var(--success)" : "var(--error)", fontSize: "0.65rem" }}>
                {faceCount === 0 ? "No Face" : faceCount === 1 ? "Face OK" : `${faceCount} Faces!`}
              </span>
            </div>

            {/* Camera Off Warning */}
            {cameraOff && (
              <div className="proctor-indicator" style={{ color: "var(--error)" }}>
                <span>📷</span>
                <span style={{ fontSize: "0.65rem" }}>Off: {cameraOffTimer}s</span>
              </div>
            )}

            {/* Eye Status */}
            <div className="proctor-indicator">
              <span>{eyeStatus === "focused" ? "👁️" : "👁️‍🗨️"}</span>
              <span style={{ color: eyeStatus === "focused" ? "var(--success)" : "var(--warning)", fontSize: "0.65rem" }}>
                {eyeStatus === "focused" ? "Focused" : "Look Forward"}
              </span>
            </div>

            {/* Noise Level */}
            <div className="proctor-indicator">
              <span>{noiseLevel > 60 ? "🔊" : noiseLevel > 30 ? "🔉" : "🔈"}</span>
              <div className="noise-meter">
                <div className="noise-bar" style={{ 
                  width: `${noiseLevel}%`,
                  background: noiseLevel > 60 ? "var(--error)" : noiseLevel > 30 ? "var(--warning)" : "var(--success)"
                }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
