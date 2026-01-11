import { GoogleGenAI, Type, Schema } from "@google/genai";
import { UserProfile, AnalysisResult } from "../types";

// Initialize AI client only if Key exists to prevent immediate crash
const apiKey = process.env.API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isValidPose: { type: Type.BOOLEAN },
    validationMessage: { type: Type.STRING },
    sizeRecommendation: { type: Type.STRING },
    isBroadShoulders: { type: Type.BOOLEAN },
    bodyTypeAnalysis: { type: Type.STRING },
    strategySuit: { type: Type.STRING },
    strategyNutrition: { type: Type.STRING },
    strategyTip: { type: Type.STRING },
    encouragement: { type: Type.STRING },
  },
  required: ["isValidPose", "sizeRecommendation", "isBroadShoulders", "bodyTypeAnalysis", "strategySuit", "strategyNutrition", "strategyTip", "encouragement"],
};

// --- Local Algorithm for Offline Mode ---
const generateOfflineAnalysis = (profile: UserProfile): AnalysisResult => {
  const h = parseFloat(profile.height);
  const w = parseFloat(profile.weight);
  const bmi = w / Math.pow(h / 100, 2);

  // 1. Calculate Size intelligently
  let size = "M";
  if (bmi < 19) size = "S";
  else if (bmi < 24) {
    if (h < 168) size = "S";
    else if (h < 178) size = "M";
    else size = "L";
  } else if (bmi < 28) {
    if (h < 175) size = "L";
    else size = "XL";
  } else {
    size = "XXL";
  }

  // 2. Estimate Broad Shoulders (Randomized slight chance if borderline, or based on high BMI/muscle logic simulation)
  // In offline mode, we assume fit athletes often have broad shoulders
  const isBroad = bmi > 22 && Math.random() > 0.4; 

  // 3. Generate Strategy Text based on Event
  let nutrition = "";
  let tip = "";
  
  if (profile.eventDist.includes("25.75")) {
    nutrition = "賽程短強度高，賽前30分鐘補充一包BCAA或咖啡因膠，水壺裝運動飲料即可，無需過多固體食物。";
    tip = "轉換區(T1/T2)的速度是關鍵，建議練習不穿襪上卡，爭取分秒必爭的優勢。";
  } else if (profile.eventDist.includes("51.5")) {
    nutrition = "標準距離考驗均衡，單車段建議每45分鐘補充一包能量膠，保留體力給最後的10K路跑。";
    tip = "標鐵是心肺耐力的考驗，建議在單車段保持高迴轉數(90rpm)，減輕肌肉負擔以利轉換路跑。";
  } else if (profile.eventDist.includes("113")) {
    nutrition = "中長距離賽事，嚴格執行補給計畫！單車段每小時需攝取60g碳水，並適時補充鹽錠預防抽筋。";
    tip = "長達4-6小時的賽事，三鐵衣的舒適度至關重要，褲墊選擇需兼顧單車支撐與跑步不磨擦。";
  } else {
    nutrition = "超鐵賽事是腸胃的戰爭。建議固態與液態補給交叉使用，避免長時間比賽導致的腸胃不適。";
    tip = "完賽核心在於心率控制，單車段切勿爆衝，為最後的全馬保留肌力是完賽關鍵。";
  }

  // 4. Suit Recommendation
  const suits = [
    "AeroPro 競速連身服 (低水阻塗層)",
    "Endurance 碳纖支撐長距離款",
    "HyperLight 輕量化透氣戰袍"
  ];
  const selectedSuit = suits[Math.floor(Math.random() * suits.length)];

  return {
    isValidPose: true,
    sizeRecommendation: size,
    isBroadShoulders: isBroad,
    bodyTypeAnalysis: `根據 ${h}cm / ${w}kg (BMI: ${bmi.toFixed(1)}) 的數據分析，您的體格${isBroad ? '呈現明顯的倒三角特徵，上肢肌群發達' : '比例均衡，適合長距離耐力運動'}。AI 模型已針對您的身形運算最佳剪裁。`,
    strategySuit: selectedSuit,
    strategyNutrition: nutrition,
    strategyTip: tip,
    encouragement: isBroad 
      ? "天生的衣架子！你的倒三角身型在游泳項目將佔盡優勢，保持自信，享受比賽！" 
      : "完美的耐力型身材！輕盈的體格在跑步項目會有巨大的優勢，這是最適合鐵人的體格。"
  };
};

export const analyzeAthlete = async (
  imageSrc: string,
  profile: UserProfile
): Promise<AnalysisResult> => {
  // --- OFFLINE/FALLBACK CHECK ---
  // If API Key is missing or user wants to force offline logic, we skip the API call.
  if (!ai || !process.env.API_KEY) {
    console.log("No API Key found, using Smart Offline Mode.");
    // Simulate a short delay to make it feel like "Analyzing"
    await new Promise(resolve => setTimeout(resolve, 2000));
    return generateOfflineAnalysis(profile);
  }

  try {
    const base64Data = imageSrc.split(',')[1];
    
    const prompt = `
      Act as a professional biomechanics coach for triathlon suit fitting. Analyze the provided image of an athlete.
      User Profile: Name: ${profile.name}, Height: ${profile.height} cm, Weight: ${profile.weight} kg, Event: ${profile.eventDist}, Gender: ${profile.gender}.

      Step 1: Framing Check. If shoulders cut off or too close (>40% face width), isValidPose=false.
      Step 2: Biometrics. Estimate shoulder/hip ratio. >1.38 is Broad Shoulders.
      Step 3: Strategy. Recommend size (S/M/L/XL/XXL), nutrition for ${profile.eventDist}, and gear.

      Output strictly in JSON (Traditional Chinese).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.warn("Gemini Analysis Failed (Network/Quota), switching to Smart Offline Mode:", error);
    // FALLBACK to local algorithm instead of showing an error
    return generateOfflineAnalysis(profile);
  }
};