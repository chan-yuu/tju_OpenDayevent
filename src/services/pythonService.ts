import { DetectionResult } from "../types";

const API_URL = "http://localhost:8000";

export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/`);
    return res.ok;
  } catch (e) {
    return false;
  }
};

export const detectObjectsPython = async (
  imageFile: File
): Promise<DetectionResult[]> => {
  const formData = new FormData();
  formData.append("file", imageFile);

  try {
    const response = await fetch(`${API_URL}/detect`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform backend response (already matches structure mostly) to DetectionResult
    // Backend returns { label: string, box_2d: [ymin, xmin, ymax, xmax] }
    // Frontend expects box_2d to be mapped to 0-1000 scale for consistency if we reused gemini logic,
    // BUT our BoundingBox type in types.ts uses 0-1 normalized floats directly.
    // The gemini service was returning 0-1000 and the App.tsx was dividing by 1000.
    // Let's standardize on the Python service returning 0-1000 to match the App.tsx expectation
    // OR update App.tsx to handle both.
    // For simplicity, let's map the python 0-1 response to the 0-1000 scale the App currently expects from the Service layer.

    return data.map((item: any) => ({
      label: item.label,
      confidence: item.confidence,
      // Convert normalized 0-1 to 0-1000 integers to match Gemini service contract
      box_2d: [
        Math.floor(item.box_2d[0] * 1000),
        Math.floor(item.box_2d[1] * 1000),
        Math.floor(item.box_2d[2] * 1000),
        Math.floor(item.box_2d[3] * 1000),
      ]
    }));

  } catch (error) {
    console.error("Python Backend Error:", error);
    throw error;
  }
};

export const trainModel = async (epochs: number = 10): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/train?epochs=${epochs}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Training failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Training Error:", error);
    throw error;
  }
};

export const getTrainingProgress = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/training-progress`);
    if (!response.ok) {
      throw new Error(`Failed to get training progress: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Training Progress Error:", error);
    throw error;
  }
};

export const getAvailableModels = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/models`);
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Get Models Error:", error);
    throw error;
  }
};

export const selectModel = async (modelPath: string): Promise<{ status: string; message: string; model_name?: string }> => {
  try {
    const response = await fetch(`${API_URL}/select-model?model_path=${encodeURIComponent(modelPath)}`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to select model: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Select Model Error:", error);
    throw error;
  }
};

export const getCurrentModel = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_URL}/current-model`);
    if (!response.ok) {
      throw new Error(`Failed to get current model: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Get Current Model Error:", error);
    throw error;
  }
};

export const startLabelImg = async (): Promise<{ status: string; message: string }> => {
  try {
    const response = await fetch(`${API_URL}/start-labelimg`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to start LabelImg: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("LabelImg Error:", error);
    throw error;
  }
};

export const openResultsFolder = async (): Promise<{ status: string; message: string; path?: string }> => {
  try {
    const response = await fetch(`${API_URL}/open-results-folder`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Failed to open results folder: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Open Results Folder Error:", error);
    throw error;
  }
};

export const detectObjectsInVideo = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const formData = new FormData();
  formData.append("file", videoFile);

  try {
    // Start progress polling
    let progressInterval: NodeJS.Timeout | null = null;
    if (onProgress) {
      progressInterval = setInterval(async () => {
        try {
          const progressRes = await fetch(`${API_URL}/video-progress`);
          if (progressRes.ok) {
            const data = await progressRes.json();
            onProgress(data.progress || 0);
          }
        } catch (e) {
          // Ignore progress fetch errors
        }
      }, 500); // Poll every 500ms
    }

    const response = await fetch(`${API_URL}/detect-video`, {
      method: "POST",
      body: formData,
    });

    // Stop progress polling
    if (progressInterval) {
      clearInterval(progressInterval);
      if (onProgress) onProgress(100);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Video detection failed: ${response.statusText}`);
    }

    // Return the video blob
    return await response.blob();
  } catch (error) {
    console.error("Video Detection Error:", error);
    throw error;
  }
};

export const detectWebcamFrame = async (cameraIndex: number = 0): Promise<{
  detections: DetectionResult[];
  frame: string;
  width: number;
  height: number;
}> => {
  try {
    const response = await fetch(`${API_URL}/detect-webcam-frame?camera_index=${cameraIndex}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Webcam detection failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform detections to match frontend format
    const detections = data.detections.map((item: any) => ({
      label: item.label,
      confidence: item.confidence,
      box_2d: [
        Math.floor(item.box_2d[0] * 1000),
        Math.floor(item.box_2d[1] * 1000),
        Math.floor(item.box_2d[2] * 1000),
        Math.floor(item.box_2d[3] * 1000),
      ]
    }));

    return {
      detections,
      frame: data.frame, // Base64 encoded image
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error("Webcam Detection Error:", error);
    throw error;
  }
};

export const listCameras = async (): Promise<{ index: number; name: string }[]> => {
  try {
    const response = await fetch(`${API_URL}/list-cameras`);

    if (!response.ok) {
      throw new Error(`Failed to list cameras: ${response.statusText}`);
    }

    const data = await response.json();
    return data.cameras || [];
  } catch (error) {
    console.error("List Cameras Error:", error);
    throw error;
  }
};
