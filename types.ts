export enum AppStep {
  INTERVIEW = 'INTERVIEW', // 新增面試階段
  FORM = 'FORM',
  CAMERA = 'CAMERA',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export interface UserProfile {
  name: string;
  height: string; // cm
  weight: string; // kg
  eventDist: string;
  style: string;
  gender: Gender;
}

export interface AnalysisResult {
  isValidPose: boolean; // 新增：構圖驗證
  validationMessage?: string; // 新增：錯誤訊息
  sizeRecommendation: string;
  bodyTypeAnalysis: string;
  isBroadShoulders: boolean;
  strategySuit: string;
  strategyNutrition: string;
  strategyTip: string;
  encouragement: string;
}

export const RACE_DISTANCES = [
  "25.75K (衝刺賽)",
  "51.5K (標準賽)",
  "113K (半程超鐵)",
  "226K (全程超鐵)"
];

export const CLOTHING_STYLES = [
  "短袖 (Short Sleeve)",
  "無袖 (Sleeveless)"
];