import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppStep, UserProfile, RACE_DISTANCES, CLOTHING_STYLES, AnalysisResult, Gender } from './types';
import { Button } from './components/Button';
import { analyzeAthlete } from './services/geminiService';
import { initializeGestureModel, detectGesture, detectRawPose, GestureResult } from './services/gestureService';

// --- Icons ---
interface IconProps {
  className?: string;
}

const CameraIcon = ({ className = "w-6 h-6" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const RefreshIcon = ({ className = "w-5 h-5" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const ChatIcon = ({ className = "w-12 h-12 text-cyan-400" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const HandIcon = ({ className = "w-8 h-8" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>;
const CheckIcon = ({ className = "w-20 h-20 text-cyan-400 mb-4" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const XIcon = ({ className = "w-20 h-20 text-red-400 mb-4" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
const AlertIcon = ({ className = "w-16 h-16 text-red-500 mb-2" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const InfoIcon = ({ className = "w-8 h-8 text-yellow-400" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = ({ className = "w-6 h-6" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const TrophyIcon = ({ className = "w-6 h-6" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BookIcon = ({ className = "w-6 h-6" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const TargetIcon = ({ className = "w-6 h-6 text-cyan-400" }: IconProps) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

// --- Content Data ---
const TRI_RESOURCES = {
  training: [
    { title: "磚式訓練 (Brick Training)", desc: "騎車後接著跑步的訓練，適應腿部轉換時的『果凍感』。" },
    { title: "有氧耐力 (Zone 2)", desc: "建立強大的有氧底層，是長距離賽事不爆掉的關鍵。" },
    { title: "轉換區 (Transition)", desc: "T1(游轉騎)與T2(騎轉跑)被稱為『第四項運動』，多練習可省下數分鐘。" }
  ],
  clubs: [
    { title: "DWD Triathlon", desc: "台灣歷史悠久的鐵人社團，適合各個層級的愛好者。" },
    { title: "醫護鐵人", desc: "結合醫療專業與運動，賽道上最安心的守護者。" },
    { title: "277自轉車", desc: "全台皆有據點，提供專業訓練課程與團練。" },
    { title: "鐵人意志", desc: "著名的線上社群，擁有大量賽事資訊與心得分享。" }
  ],
  institutions: [
    { title: "Waypoint", desc: "專業鐵人訓練中心，提供功率訓練與科學化分析。" },
    { title: "IRONMAN Taiwan", desc: "官方賽事機構，定期舉辦訓練營與說明會。" },
    { title: "XTERRA", desc: "越野三項的最高殿堂，適合喜歡大自然的挑戰者。" }
  ]
};

const STEPS_INFO = [
  {
    tip: "💡 游泳小知識：開放水域游泳時，『定位』比速度更重要，抬頭確認方向才不會游歪。",
    insight: "戰術分析：此題決定上半身的剪裁活動度。游泳高手需要極致的肩部旋轉靈活度；初學者則需要更多浮力與支撐。"
  },
  {
    tip: "💡 騎車小知識：標準賽(51.5K)通常禁止『跟車(Drafting)』，需保持10公尺車距。",
    insight: "戰術分析：此題影響褲墊(Chamois)的選擇。自行車單項強者傾向更薄的褲墊以利輸出；新手則需厚墊來緩解長途騎乘的疼痛。"
  },
  {
    tip: "💡 跑步小知識：剛下車跑步時雙腿會感到沉重，這是正常的生理反應，調整步頻即可。",
    insight: "戰術分析：此題關乎肌肉壓縮技術。跑步是最後一項，針對跑步強化的腿部壓縮布料能有效延緩抽筋與乳酸堆積。"
  },
  {
    tip: "💡 參賽小知識：第一次比賽建議選擇『接力組』，感受氣氛且壓力較小。",
    insight: "戰術分析：了解您的參賽經驗有助於我們推薦『競速型』還是『完賽型』的裝備配置。"
  }
];

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.INTERVIEW);
  
  // Interview State
  const [interviewStep, setInterviewStep] = useState(0); 
  const [abilities, setAbilities] = useState({ swim: false, bike: false, run: false });
  const [activeTab, setActiveTab] = useState<'training' | 'clubs' | 'institutions'>('training');
  
  // Gesture State
  const [gestureProgress, setGestureProgress] = useState(0);
  const [activeGesture, setActiveGesture] = useState<GestureResult>('NONE');
  const [isGestureModelLoaded, setIsGestureModelLoaded] = useState(false);
  const gestureLockRef = useRef(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    height: '175',
    weight: '70',
    eventDist: RACE_DISTANCES[1],
    style: CLOTHING_STYLES[0],
    gender: Gender.MALE
  });
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [realtimeFeedback, setRealtimeFeedback] = useState<string | null>(null);
  const [isPoseStable, setIsPoseStable] = useState(false);
  const [stabilityPercentage, setStabilityPercentage] = useState(0); // 0-100 for UI
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gestureReqRef = useRef<number | null>(null);
  const cameraLoopRef = useRef<number | null>(null);
  const stabilityCounterRef = useRef<number>(0);
  const lastSpokenTimeRef = useRef<number>(0);

  // --- Voice Synthesis ---
  const speak = useCallback((text: string, force: boolean = false) => {
    if ('speechSynthesis' in window) {
      const now = Date.now();
      if (!force && now - lastSpokenTimeRef.current < 3000) return;
      
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('TW') || v.lang.includes('cmn'));
      if (zhVoice) utterance.voice = zhVoice;
      window.speechSynthesis.speak(utterance);
      lastSpokenTimeRef.current = now;
    }
  }, []);

  // --- Load Gesture Model on Mount ---
  useEffect(() => {
    initializeGestureModel()
      .then(() => {
        console.log("Gesture Model Loaded");
        setIsGestureModelLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load gesture model:", err);
      });
  }, []);

  // --- Gesture Loop for Interview ---
  useEffect(() => {
    if (step !== AppStep.INTERVIEW || !isGestureModelLoaded) {
      if (gestureReqRef.current) cancelAnimationFrame(gestureReqRef.current);
      return;
    }

    const detectLoop = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const gesture = detectGesture(videoRef.current);
        setActiveGesture(gesture);

        if (gestureLockRef.current) {
          if (gesture === 'NONE') {
            gestureLockRef.current = false;
            setGestureProgress(0);
          } else {
            setGestureProgress(0);
            gestureReqRef.current = requestAnimationFrame(detectLoop);
            return;
          }
        }

        if (gesture !== 'NONE') {
          setGestureProgress(prev => {
            const next = prev + 1.0; 
            if (next >= 100) {
              handleAnswer(gesture === 'LEFT_RAISED'); 
              return 0; 
            }
            return next;
          });
        } else {
          setGestureProgress(0);
        }
      }
      gestureReqRef.current = requestAnimationFrame(detectLoop);
    };

    gestureReqRef.current = requestAnimationFrame(detectLoop);
    return () => {
      if (gestureReqRef.current) cancelAnimationFrame(gestureReqRef.current);
    };
  }, [step, isGestureModelLoaded, interviewStep]); 

  // --- Real-time Camera Pose Loop ---
  useEffect(() => {
    if (step !== AppStep.CAMERA) {
      if (cameraLoopRef.current) cancelAnimationFrame(cameraLoopRef.current);
      return;
    }

    const STABLE_THRESHOLD = 40; 

    const poseLoop = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.save();
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          const landmarks = detectRawPose(video);
          let currentFeedback: string | null = null;
          let color = '#00ffff'; 

          if (landmarks) {
             const ls = landmarks[11]; // Left Shoulder
             const rs = landmarks[12]; // Right Shoulder
             const x1 = ls.x * canvas.width;
             const y1 = ls.y * canvas.height;
             const x2 = rs.x * canvas.width;
             const y2 = rs.y * canvas.height;

             // STRICT ALGORITHMS
             const isCutOff = ls.x < 0.1 || ls.x > 0.9 || rs.x < 0.1 || rs.x > 0.9;
             const shoulderWidth = Math.abs(ls.x - rs.x);
             const isTooClose = shoulderWidth > 0.70; 
             const isTooFar = shoulderWidth < 0.25;
             const centerPt = (ls.x + rs.x) / 2;
             const isOffCenter = Math.abs(centerPt - 0.5) > 0.15;
             const tilt = Math.abs(ls.y - rs.y);
             const isTilted = tilt > 0.05;

             if (isCutOff) { currentFeedback = "請將身體移至畫面中央"; color = '#ef4444'; }
             else if (isOffCenter) { currentFeedback = "請往中間站一點"; color = '#ef4444'; }
             else if (isTooClose) { currentFeedback = "太近了 (請退後)"; color = '#ef4444'; }
             else if (isTooFar) { currentFeedback = "太遠了 (請靠近)"; color = '#facc15'; }
             else if (isTilted) { currentFeedback = "肩膀不水平 (請站直)"; color = '#facc15'; }
             else { currentFeedback = null; }

             if (currentFeedback === null) {
                if (stabilityCounterRef.current < STABLE_THRESHOLD) stabilityCounterRef.current += 1;
             } else {
                if (stabilityCounterRef.current > 0) stabilityCounterRef.current -= 2; 
                if (stabilityCounterRef.current < 0) stabilityCounterRef.current = 0;
                if (stabilityCounterRef.current === 0) speak(currentFeedback);
             }

             const isStableNow = stabilityCounterRef.current >= STABLE_THRESHOLD;
             setIsPoseStable(isStableNow);
             setRealtimeFeedback(currentFeedback);
             
             const percentage = Math.min(Math.round((stabilityCounterRef.current / STABLE_THRESHOLD) * 100), 100);
             setStabilityPercentage(percentage);

             ctx.strokeStyle = isStableNow ? '#10b981' : color; 
             ctx.lineWidth = 6;
             ctx.lineJoin = 'round';
             ctx.lineCap = 'round';
             ctx.shadowBlur = isStableNow ? 30 : 15;
             ctx.shadowColor = ctx.strokeStyle;
             
             ctx.beginPath();
             ctx.moveTo(x1, y1);
             ctx.lineTo(x2, y2);
             const midX = (x1 + x2) / 2;
             const midY = (y1 + y2) / 2 + (Math.abs(x1 - x2) * 1.5); 
             ctx.lineTo(midX, midY);
             ctx.closePath();
             ctx.stroke();

             ctx.fillStyle = isStableNow ? '#10b981' : '#ffffff'; 
             [ls, rs].forEach(pt => {
               ctx.beginPath();
               ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 8, 0, 2 * Math.PI);
               ctx.fill();
             });
             
             if (percentage > 0) {
                const centerX = midX;
                const centerY = (y1 + y2) / 2 + (midY - ((y1 + y2) / 2)) / 3; 
                const radius = Math.abs(x1 - x2) * 0.4; 
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * (percentage / 100)));
                ctx.strokeStyle = isStableNow ? '#10b981' : '#facc15'; 
                ctx.lineWidth = 8;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 8;
                ctx.stroke();
             }

             if (!isStableNow) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(canvas.width * 0.5, 0);
                ctx.lineTo(canvas.width * 0.5, canvas.height);
                ctx.stroke();
             }

          } else {
            setRealtimeFeedback("未偵測到人員");
            stabilityCounterRef.current = 0;
            setStabilityPercentage(0);
            setIsPoseStable(false);
          }
          ctx.restore();
        }
      }
      cameraLoopRef.current = requestAnimationFrame(poseLoop);
    };

    cameraLoopRef.current = requestAnimationFrame(poseLoop);

    return () => {
      if (cameraLoopRef.current) cancelAnimationFrame(cameraLoopRef.current);
    };

  }, [step]);

  const handleAnswer = (answer: boolean) => {
    gestureLockRef.current = true; 
    setGestureProgress(0);
    setActiveGesture('NONE');

    if (interviewStep === 0) {
      setAbilities(prev => ({ ...prev, swim: answer }));
      setInterviewStep(1);
    } else if (interviewStep === 1) {
      setAbilities(prev => ({ ...prev, bike: answer }));
      setInterviewStep(2);
    } else if (interviewStep === 2) {
      const newRun = answer;
      const newAbilities = { ...abilities, run: newRun };
      setAbilities(newAbilities);
      
      const allYes = newAbilities.swim && newAbilities.bike && newRun;
      if (allYes) {
        setInterviewStep(3); 
      } else {
        setInterviewStep(4); 
      }
    } else if (interviewStep === 3) {
      if (answer) {
        speak("太棒了，你是我們的同好！那我們直接來挑選升級你的裝備與衣服吧！", true);
        setTimeout(() => setStep(AppStep.FORM), 2000);
      } else {
        speak("那不如現在就進到店裡試試吧！這裡有一些豐富的三鐵資源推薦給您。", true);
        setInterviewStep(5);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const startCamera = () => {
    setStep(AppStep.CAMERA);
    setValidationError(null);
    setRealtimeFeedback(null);
    setIsPoseStable(false);
    stabilityCounterRef.current = 0;
    setStabilityPercentage(0);
    speak(`歡迎 ${profile.name || '選手'}。請站到鏡頭前，雙手自然下垂，保持靜止。`, true);
  };

  // --- Interview Logic ---
  useEffect(() => {
    if (step === AppStep.INTERVIEW) {
      const questions = [
        "你會游泳嗎？🏊",
        "你會騎腳踏車嗎？🚴",
        "你會跑步嗎？🏃",
        "之前參加過三鐵嗎？🏆"
      ];
      
      const timer = setTimeout(() => {
         // Enable camera for gesture detection
         if (videoRef.current) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
             .then(s => {
               if(videoRef.current) {
                 videoRef.current.srcObject = s;
                 videoRef.current.play();
               }
             });
         }
         
         if (interviewStep < 3) speak(questions[interviewStep], true);
         else if (interviewStep === 3) speak(questions[3], true);
         else if (interviewStep === 4 && !Object.values(abilities).every(Boolean)) speak("沒關係，三鐵是循序漸進的。", true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, interviewStep, speak]); 

  // --- Camera Init ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (step === AppStep.CAMERA) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        })
        .catch(err => console.error("Camera Error:", err));
    }
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [step]);

  // --- Countdown & Capture ---
  const initiateCapture = () => {
    if (!isPoseStable) {
       if (realtimeFeedback) speak(realtimeFeedback, true);
       else speak("請保持姿勢穩定", true);
       return; 
    }

    setValidationError(null);
    let count = 3;
    setCountdown(count);
    speak("3", true);
    
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        speak(count.toString(), true);
      } else {
        clearInterval(interval);
        setCountdown(null);
        captureImage();
      }
    }, 1000);
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      speak("影像分析中...", true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setStep(AppStep.ANALYZING);
        const result = await analyzeAthlete(dataUrl, profile);
        if (!result.isValidPose) {
          const msg = result.validationMessage || "請退後一點，我看不到你的肩膀";
          speak(msg, true);
          setValidationError(msg);
          setStep(AppStep.CAMERA); 
          setTimeout(() => setValidationError(null), 4000);
          return;
        }
        setImageSrc(dataUrl);
        setAnalysis(result);
        setStep(AppStep.RESULT);
        speak("分析完成。" + result.encouragement, true);
      }
    }
  };

  const resetApp = () => {
    setStep(AppStep.INTERVIEW);
    setInterviewStep(0);
    setAbilities({ swim: false, bike: false, run: false });
    setAnalysis(null);
    setImageSrc(null);
    setGestureProgress(0);
    gestureLockRef.current = false;
  };

  // --- Render Functions ---
  const renderInterview = () => {
    const questions = [
      "你會游泳嗎？",
      "你會騎腳踏車嗎？",
      "你會跑步嗎？",
      "參加過三鐵嗎？"
    ];
    
    const bgCamera = (
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/60 z-10"></div>
        {/* HUD Grid Overlay */}
        <div className="absolute inset-0 z-10 opacity-20 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute inset-0 z-10 opacity-30 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)]"></div>
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover transform scale-x-[-1] opacity-60 blur-[1px]" />
      </div>
    );

    // STEP 4: Encouragement Screen (Keep similar layout but cleaner)
    if (interviewStep === 4) {
      return (
        <div className="h-full flex flex-col justify-center relative overflow-hidden p-8">
          {bgCamera}
          <div className="relative z-20 max-w-4xl w-full mx-auto p-12 bg-slate-900/90 backdrop-blur-xl border-2 border-slate-600 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in text-center flex flex-col items-center">
            <ChatIcon />
            <h2 className="text-5xl font-display font-bold mt-6 mb-4 text-white tracking-wide">沒關係！</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 mb-8"></div>
            <p className="text-slate-200 mb-10 text-2xl leading-relaxed">
              三鐵是循序漸進的運動。<br/>你可以先從擅長的項目開始，<br/>我們有完整的訓練地圖帶你入門！
            </p>
            <div className="flex gap-6 w-full max-w-lg">
              <Button onClick={() => setStep(AppStep.FORM)} fullWidth className="text-xl py-4">
                開始選購裝備
              </Button>
              <Button onClick={() => setInterviewStep(5)} variant="secondary" fullWidth className="text-xl py-4">
                探索訓練資源
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // STEP 5: Full Screen Resource Hub (Larger text)
    if (interviewStep === 5) {
      return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-900">
           {bgCamera}
           <div className="absolute inset-0 z-10 bg-slate-900/80"></div>
           
           <div className="relative z-20 w-full h-full flex flex-col p-8 md:p-12 animate-fade-in">
             {/* Header */}
             <div className="flex justify-between items-end mb-10 border-b border-slate-700 pb-6">
                <div>
                   <h2 className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white mb-2">
                      TRI-HUB 資源中心
                   </h2>
                   <p className="text-slate-400 text-xl tracking-widest uppercase">Triathlon Beginner Guide & Resources</p>
                </div>
                <Button onClick={() => setStep(AppStep.FORM)} className="w-auto px-10 py-4 text-xl">
                  準備好了，開始掃描
                </Button>
             </div>

             {/* Tab Navigation - Large */}
             <div className="flex space-x-4 mb-8">
                {['training', 'clubs', 'institutions'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)} 
                    className={`px-8 py-5 rounded-xl font-bold text-xl transition-all flex items-center gap-3 border-2 ${activeTab === tab ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {tab === 'training' && <BookIcon/>}
                    {tab === 'clubs' && <UsersIcon/>}
                    {tab === 'institutions' && <TrophyIcon/>}
                    {tab === 'training' ? '訓練觀念' : tab === 'clubs' ? '知名社團' : '專業機構'}
                  </button>
                ))}
             </div>

             {/* Content Grid - Large Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-y-auto pb-12 pr-4 custom-scrollbar">
                {TRI_RESOURCES[activeTab].map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/60 backdrop-blur-md border border-slate-600 p-8 rounded-3xl hover:border-cyan-400 transition-all group cursor-default shadow-lg hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] hover:-translate-y-1">
                     <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                     <p className="text-slate-300 text-lg leading-loose">{item.desc}</p>
                  </div>
                ))}
                
                {/* Promo Card */}
                <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 p-8 rounded-3xl flex flex-col justify-center items-center text-center">
                   <InfoIcon />
                   <h3 className="text-2xl font-bold text-white mt-4">想了解更多？</h3>
                   <p className="text-lg text-cyan-200 mt-2 mb-6">加入官方 Line 獲得完整訓練清單</p>
                   <div className="w-32 h-32 bg-white p-3 rounded-xl shadow-inner">
                      <div className="w-full h-full bg-slate-900 pattern-dots opacity-80"></div>
                   </div>
                </div>
             </div>
           </div>
        </div>
      );
    }

    // MAIN INTERVIEW INTERFACE (Steps 0-3) - FULL SCREEN HUD
    return (
      <div className="h-full w-full flex flex-col relative overflow-hidden bg-black">
        {bgCamera}
        
        {/* TOP: Question Header */}
        <div className="absolute top-0 left-0 w-full z-30 p-8 pt-12 flex flex-col items-center">
          <div className="mb-4 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700">
             <span className="text-cyan-400 font-display font-bold text-xl tracking-widest">Q. 0{interviewStep + 1} / 04</span>
             <div className="h-4 w-px bg-slate-600"></div>
             {isGestureModelLoaded ? (
               <span className="text-green-400 text-sm font-mono flex items-center gap-2">● AI VISION READY</span>
             ) : (
               <span className="text-yellow-400 text-sm font-mono flex items-center gap-2">○ LOADING MODEL...</span>
             )}
          </div>
          <h2 className="text-7xl md:text-8xl font-display font-black text-white text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-wide uppercase leading-tight">
            {questions[interviewStep]}
          </h2>
        </div>

        {/* MIDDLE: Interaction Zones (Split Screen) */}
        <div className="relative z-20 flex-1 w-full flex justify-between items-stretch mt-32 mb-40 px-4 gap-8">
           
           {/* LEFT ZONE - YES */}
           <div 
             className={`flex-1 rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer backdrop-blur-sm
             ${activeGesture === 'LEFT_RAISED' 
               ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_80px_rgba(34,211,238,0.3)] scale-[1.02]' 
               : 'border-slate-600/50 bg-slate-900/20 hover:bg-slate-800/30'}
             `}
             onClick={() => handleAnswer(true)}
           >
              {activeGesture === 'LEFT_RAISED' && (
                <div className="absolute bottom-0 left-0 w-full bg-cyan-500/30 transition-all ease-linear" style={{ height: `${gestureProgress}%` }}></div>
              )}
              
              <CheckIcon />
              <span className="text-6xl md:text-8xl font-black text-white uppercase tracking-wider drop-shadow-lg">
                {interviewStep === 3 ? "有" : "會"}
              </span>
              <span className="text-3xl font-display text-cyan-400 mt-2">YES</span>
              
              <div className="absolute bottom-8 flex items-center gap-3 text-cyan-300 font-mono text-lg bg-black/60 px-4 py-2 rounded-lg border border-cyan-500/30">
                 <HandIcon /> 舉左手 (Left)
              </div>
           </div>

           {/* RIGHT ZONE - NO */}
           <div 
             className={`flex-1 rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer backdrop-blur-sm
             ${activeGesture === 'RIGHT_RAISED' 
               ? 'border-red-400 bg-red-900/30 shadow-[0_0_80px_rgba(248,113,113,0.3)] scale-[1.02]' 
               : 'border-slate-600/50 bg-slate-900/20 hover:bg-slate-800/30'}
             `}
             onClick={() => handleAnswer(false)}
           >
              {activeGesture === 'RIGHT_RAISED' && (
                <div className="absolute bottom-0 left-0 w-full bg-red-500/30 transition-all ease-linear" style={{ height: `${gestureProgress}%` }}></div>
              )}

              <XIcon />
              <span className="text-6xl md:text-8xl font-black text-white uppercase tracking-wider drop-shadow-lg">
                {interviewStep === 3 ? "沒有" : "不會"}
              </span>
              <span className="text-3xl font-display text-red-400 mt-2">NO</span>

              <div className="absolute bottom-8 flex items-center gap-3 text-red-300 font-mono text-lg bg-black/60 px-4 py-2 rounded-lg border border-red-500/30">
                 <HandIcon /> 舉右手 (Right)
              </div>
           </div>
        </div>

        {/* BOTTOM: Tactical Insight & Tip */}
        <div className="absolute bottom-0 w-full z-30 p-8 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent">
          {STEPS_INFO[interviewStep] && (
             <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Insight Card */}
                <div className="col-span-2 bg-slate-800/60 backdrop-blur-md border-l-8 border-cyan-500 p-6 rounded-r-xl shadow-lg">
                   <div className="flex items-center gap-3 mb-2">
                      <TargetIcon />
                      <h4 className="text-cyan-400 font-bold uppercase tracking-widest">TACTICAL ANALYSIS | 戰術分析</h4>
                   </div>
                   <p className="text-white text-xl font-medium leading-relaxed">
                      {STEPS_INFO[interviewStep].insight.replace('戰術分析：', '')}
                   </p>
                </div>
                
                {/* Fun Fact Card */}
                <div className="col-span-1 bg-yellow-900/20 backdrop-blur-md border-l-8 border-yellow-400 p-6 rounded-r-xl shadow-lg">
                   <div className="flex items-center gap-3 mb-2">
                      <InfoIcon />
                      <h4 className="text-yellow-400 font-bold uppercase tracking-widest">PRO TIP</h4>
                   </div>
                   <p className="text-yellow-100 text-lg">
                      {STEPS_INFO[interviewStep].tip.replace('💡 ', '').split('：')[1] || STEPS_INFO[interviewStep].tip.replace('💡 ', '')}
                   </p>
                </div>
             </div>
          )}
        </div>

      </div>
    );
  };

  const renderForm = () => (
    <div className="h-full flex flex-col justify-center">
    <div className="max-w-md w-full mx-auto p-8 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">TRIPLES AI</h1>
        <p className="text-slate-400 text-sm tracking-widest uppercase">極致效能優化系統</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-cyan-400 text-xs font-bold uppercase mb-2">運動員姓名 (Name)</label>
          <input 
            type="text" 
            name="name" 
            value={profile.name} 
            onChange={handleInputChange} 
            placeholder="請輸入姓名"
            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">身高 (cm)</label>
            <input 
              type="number" 
              name="height" 
              value={profile.height} 
              onChange={handleInputChange} 
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-2">體重 (kg)</label>
            <input 
              type="number" 
              name="weight" 
              value={profile.weight} 
              onChange={handleInputChange} 
              className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase mb-2">目標賽事 (Event)</label>
          <select 
            name="eventDist" 
            value={profile.eventDist} 
            onChange={handleInputChange}
            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded focus:outline-none focus:border-cyan-500"
          >
            {RACE_DISTANCES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase mb-2">性別 (Gender)</label>
           <div className="flex space-x-4">
            {Object.values(Gender).map((g) => (
              <label key={g} className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="gender" 
                  value={g} 
                  checked={profile.gender === g} 
                  onChange={handleInputChange}
                  className="accent-cyan-500"
                />
                <span className="text-sm">{g === Gender.MALE ? '男' : '女'}</span>
              </label>
            ))}
          </div>
        </div>

        <Button onClick={startCamera} fullWidth className="mt-4">
          啟動系統
        </Button>
      </div>
    </div>
    </div>
  );

  const renderCamera = () => (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden">
      {/* Full screen video container */}
      <div className="relative w-full h-full bg-slate-900 overflow-hidden">
        {/* Video Feed */}
        <video 
          ref={videoRef} 
          muted 
          playsInline 
          className="w-full h-full object-cover transform scale-x-[-1]" 
        />
        {/* Canvas for skeletal overlay */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner Brackets - adjusted for full screen feel */}
          <div className="absolute top-10 left-10 w-24 h-24 border-l-4 border-t-4 border-cyan-500/80"></div>
          <div className="absolute top-10 right-10 w-24 h-24 border-r-4 border-t-4 border-cyan-500/80"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 border-l-4 border-b-4 border-cyan-500/80"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 border-r-4 border-b-4 border-cyan-500/80"></div>
          
          {/* Scanning Line - Hide on Error */}
          {!realtimeFeedback && isPoseStable && <div className="scan-line"></div>}
          
          {/* Realtime Feedback Overlay - Center Screen */}
          {realtimeFeedback && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-50 animate-fade-in">
               <AlertIcon />
               <h3 className="text-4xl font-bold text-red-500 mb-2 drop-shadow-lg">姿勢偵測錯誤</h3>
               <p className="text-2xl text-white font-bold drop-shadow-lg bg-black/50 px-6 py-2 rounded-full">{realtimeFeedback}</p>
               <p className="text-slate-300 mt-4 animate-pulse">請調整姿勢...</p>
             </div>
          )}
        </div>

        {/* Validation Error Overlay (from Gemini) */}
        {validationError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 animate-fade-in p-8 text-center">
            <AlertIcon />
            <h3 className="text-3xl font-bold text-red-500 mb-4">分析結果異常</h3>
            <p className="text-xl text-white font-medium">{validationError}</p>
            <p className="text-slate-400 mt-4 text-sm animate-pulse">請重新調整站位...</p>
          </div>
        )}

        {/* Countdown Overlay */}
        {countdown !== null && !validationError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
            <span className="text-9xl font-display font-bold text-cyan-400 animate-ping">{countdown}</span>
          </div>
        )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-4 z-20">
        <Button onClick={() => setStep(AppStep.FORM)} variant="secondary">返回</Button>
        <Button 
          onClick={initiateCapture} 
          disabled={countdown !== null || !isPoseStable} 
          className={`w-56 transition-all duration-300 ${(countdown !== null || !isPoseStable) ? 'opacity-50 cursor-not-allowed bg-slate-700 border-slate-600 text-slate-400' : 'bg-cyan-500 border-cyan-400 hover:scale-105'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <CameraIcon />
            <span>
              {countdown !== null ? '倒數中...' : 
               isPoseStable ? '開始掃描' : 
               stabilityPercentage > 0 ? `保持不動 ${stabilityPercentage}%` : '調整中...'}
            </span>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="relative w-32 h-32">
        <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-display font-bold text-white mb-2">生物特徵分析中</h2>
        <p className="text-cyan-400/80 animate-pulse">正在檢查構圖完整性... 精確測量肩寬...</p>
      </div>
    </div>
  );

  const renderResult = () => {
    if (!analysis || !imageSrc) return null;

    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full overflow-y-auto">
        <div className="lg:col-span-4 space-y-6">
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] group">
            <img src={imageSrc} alt="Scan" className="w-full h-auto object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6">
               <h3 className="text-3xl font-display text-white mb-1">{profile.name || "選手"}</h3>
               <p className="text-cyan-400 font-mono">{profile.height}cm / {profile.weight}kg</p>
               <div className="mt-2 text-xs bg-slate-800/80 inline-block px-2 py-1 rounded text-slate-400">BMI: {(parseFloat(profile.weight) / Math.pow(parseFloat(profile.height)/100, 2)).toFixed(1)}</div>
            </div>
          </div>

          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 backdrop-blur-md">
             <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest border-b border-slate-700 pb-2">BODY COMPOSITION</h4>
             <div className="flex justify-between items-center mb-4">
                <span className="text-white text-lg">倒三角身型 (V-Taper)</span>
                <span className={`font-bold px-3 py-1 rounded-full text-sm ${analysis.isBroadShoulders ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-300'}`}>
                  {analysis.isBroadShoulders ? 'EXCELLENT' : 'NORMAL'}
                </span>
             </div>
             <p className="text-slate-300 text-sm italic leading-relaxed border-l-2 border-slate-500 pl-3">
               "{analysis.bodyTypeAnalysis}"
             </p>
          </div>

          {/* New Community Section */}
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-600 backdrop-blur-md">
             <h4 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><UsersIcon className="w-4 h-4"/> 推薦加入社群</h4>
             <ul className="text-sm text-slate-300 space-y-3">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                  <span><strong className="text-white">DWD Triathlon:</strong> 找夥伴</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                  <span><strong className="text-white">醫護鐵人:</strong> 安全守護</span>
                </li>
             </ul>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-700 pb-6">
            <div>
               <h2 className="text-5xl font-display font-black text-white tracking-tight">AI 分析報告</h2>
               <p className="text-cyan-500 font-mono text-sm mt-2 flex items-center gap-2">
                 <span className="w-2 h-2 bg-cyan-500 animate-pulse rounded-full"></span>
                 GENERATED BY GEMINI 2.5 VISION
               </p>
            </div>
            <div className="text-right mt-4 md:mt-0">
              <span className="block text-xs text-slate-400 uppercase tracking-widest mb-1">RECOMMENDED SIZE</span>
              <span className="text-7xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 drop-shadow-lg">{analysis.sizeRecommendation}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/40 p-8 rounded-2xl border-t-4 border-green-500 shadow-lg backdrop-blur-sm">
               <h5 className="text-green-400 font-bold uppercase text-xs mb-3 tracking-widest">GEAR SELECTION</h5>
               <p className="text-white font-medium text-xl leading-snug">{analysis.strategySuit}</p>
            </div>
            <div className="bg-slate-800/40 p-8 rounded-2xl border-t-4 border-yellow-500 shadow-lg backdrop-blur-sm">
               <h5 className="text-yellow-400 font-bold uppercase text-xs mb-3 tracking-widest">PRO COACH TIP</h5>
               <p className="text-white text-base leading-relaxed">{analysis.strategyTip}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-700 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><TrophyIcon className="w-24 h-24"/></div>
             <h5 className="text-cyan-400 font-bold uppercase text-xs mb-4 flex items-center gap-2">
               <span className="w-6 h-[1px] bg-cyan-400"></span>
               NUTRITION STRATEGY ({profile.eventDist})
             </h5>
             <p className="text-slate-200 leading-loose text-lg relative z-10">{analysis.strategyNutrition}</p>
          </div>

          <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-8 rounded-2xl border border-cyan-500/20 flex items-start gap-4">
            <div className="text-6xl text-cyan-600 font-serif leading-none opacity-50">"</div>
            <p className="text-xl text-cyan-50 italic font-medium leading-relaxed pt-2">{analysis.encouragement}</p>
          </div>

          <div className="mt-auto flex flex-wrap gap-4 pt-6">
            <Button onClick={resetApp} variant="secondary" className="flex-1 min-w-[150px]">
              <div className="flex items-center justify-center gap-2">
                 <RefreshIcon />
                 <span>重新體驗</span>
              </div>
            </Button>
            <Button onClick={() => window.print()} variant="primary" className="flex-1 min-w-[150px]">
              儲存報告
            </Button>
            <Button onClick={() => window.open('https://www.triples520.com/', '_blank')} variant="ghost" className="min-w-[120px]">
              前往商城
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white selection:bg-cyan-500 selection:text-black font-sans">
      <main className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {step === AppStep.INTERVIEW && renderInterview()}
        {step === AppStep.FORM && renderForm()}
        {step === AppStep.CAMERA && renderCamera()}
        {step === AppStep.ANALYZING && renderAnalyzing()}
        {step === AppStep.RESULT && renderResult()}
        
        <div className="absolute bottom-4 text-slate-600 text-xs font-mono z-50 pointer-events-none">
          TRIPLES AI SYSTEM v3.0 | POWERED BY GOOGLE GEMINI
        </div>
      </main>
    </div>
  );
};

export default App;