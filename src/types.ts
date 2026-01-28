export interface BoundingBox {
  id: string;
  label: string;
  // Normalized coordinates (0 to 1)
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  confidence?: number;
}

export interface DetectionResult {
  label: string;
  confidence: number;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}
