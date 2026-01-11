import { PoseLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;
const runningMode: "IMAGE" | "VIDEO" = "VIDEO";

export const initializeGestureModel = async () => {
  if (poseLandmarker) return poseLandmarker;

  try {
    console.log("Loading MediaPipe Vision...");
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );

    console.log("Loading Pose Landmarker Model...");
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        // Change to 'lite' model for faster loading and better stability
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        // Use 'CPU' to avoid WebGL compatibility issues which cause "Initializing" to hang
        delegate: "CPU" 
      },
      runningMode: runningMode,
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    
    console.log("Pose Landmarker created successfully!");
    return poseLandmarker;
  } catch (error) {
    console.error("Error initializing gesture model:", error);
    throw error;
  }
};

export type GestureResult = 'LEFT_RAISED' | 'RIGHT_RAISED' | 'NONE';

// Helper to get raw landmarks for drawing
export const detectRawPose = (video: HTMLVideoElement): NormalizedLandmark[] | null => {
  if (!poseLandmarker) return null;
  const startTimeMs = performance.now();
  try {
    const results = poseLandmarker.detectForVideo(video, startTimeMs);
    if (results.landmarks && results.landmarks.length > 0) {
      return results.landmarks[0];
    }
  } catch (error) {
    // console.warn("Pose detection error:", error);
  }
  return null;
};

export const detectGesture = (video: HTMLVideoElement): GestureResult => {
  const lm = detectRawPose(video);
  if (!lm) return 'NONE';

  // Landmarks Reference:
  // 11: Left Shoulder, 12: Right Shoulder
  // 13: Left Elbow, 14: Right Elbow
  // 15: Left Wrist, 16: Right Wrist
  
  const leftShoulder = lm[11];
  const rightShoulder = lm[12];
  const leftElbow = lm[13];
  const rightElbow = lm[14];
  const leftWrist = lm[15];
  const rightWrist = lm[16];

  // Logic: Hand is raised if Wrist is HIGHER (smaller Y value) than Shoulder AND Elbow.
  
  const isLeftRaised = (leftWrist.y < leftShoulder.y) && (leftWrist.y < leftElbow.y);
  const isRightRaised = (rightWrist.y < rightShoulder.y) && (rightWrist.y < rightElbow.y);

  if (isLeftRaised && !isRightRaised) return 'LEFT_RAISED'; 
  if (isRightRaised && !isLeftRaised) return 'RIGHT_RAISED'; 

  return 'NONE';
};