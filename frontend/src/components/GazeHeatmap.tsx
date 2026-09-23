import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography, Button, Stack } from '@mui/material';
import { GazePoint } from '../types/gaze.types';

interface GazeHeatmapProps {
  gazePoints: GazePoint[];
  width?: number;
  height?: number;
  intensity?: number;
  radius?: number;
  title?: string;
  onClear?: () => void;
}

/**
 * GazeHeatmap Component
 * 
 * Visualizes gaze tracking data as a heatmap overlay.
 * Uses canvas to render density-based visualization of gaze points.
 * 
 * Features:
 * - Real-time heatmap rendering
 * - Configurable intensity and radius
 * - Automatic density calculation
 * - Responsive canvas sizing
 * - Clear functionality
 */
const GazeHeatmap: React.FC<GazeHeatmapProps> = ({
  gazePoints,
  width = 800,
  height = 600,
  intensity = 0.5,
  radius = 50,
  title = 'Gaze Heatmap',
  onClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Filter valid gaze points
    const validPoints = gazePoints.filter(
      point => point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
    );
    setPointCount(validPoints.length);

    if (validPoints.length === 0) return;

    // Create heatmap
    drawHeatmap(ctx, validPoints, width, height, intensity, radius);
  }, [gazePoints, width, height, intensity, radius]);

  /**
   * Draw heatmap using radial gradients
   */
  const drawHeatmap = (
    ctx: CanvasRenderingContext2D,
    points: GazePoint[],
    canvasWidth: number,
    canvasHeight: number,
    heatIntensity: number,
    heatRadius: number
  ) => {
    // Create temporary canvas for alpha blending
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw each point as a radial gradient
    points.forEach(point => {
      const gradient = tempCtx.createRadialGradient(
        point.x,
        point.y,
        0,
        point.x,
        point.y,
        heatRadius
      );

      // Gradient from center (high intensity) to edge (transparent)
      gradient.addColorStop(0, `rgba(255, 255, 255, ${heatIntensity})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${heatIntensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.fillRect(
        point.x - heatRadius,
        point.y - heatRadius,
        heatRadius * 2,
        heatRadius * 2
      );
    });

    // Get image data for color mapping
    const imageData = tempCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    const data = imageData.data;

    // Apply color gradient based on intensity
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3] / 255;
      if (alpha > 0) {
        const color = getHeatColor(alpha);
        data[i] = color.r;
        data[i + 1] = color.g;
        data[i + 2] = color.b;
        data[i + 3] = alpha * 255;
      }
    }

    // Draw colored heatmap
    ctx.putImageData(imageData, 0, 0);
  };

  /**
   * Get color based on heat intensity
   * Blue (cold) -> Green -> Yellow -> Red (hot)
   */
  const getHeatColor = (intensity: number): { r: number; g: number; b: number } => {
    if (intensity < 0.25) {
      // Blue to Cyan
      const t = intensity / 0.25;
      return {
        r: 0,
        g: Math.floor(t * 255),
        b: 255
      };
    } else if (intensity < 0.5) {
      // Cyan to Green
      const t = (intensity - 0.25) / 0.25;
      return {
        r: 0,
        g: 255,
        b: Math.floor((1 - t) * 255)
      };
    } else if (intensity < 0.75) {
      // Green to Yellow
      const t = (intensity - 0.5) / 0.25;
      return {
        r: Math.floor(t * 255),
        g: 255,
        b: 0
      };
    } else {
      // Yellow to Red
      const t = (intensity - 0.75) / 0.25;
      return {
        r: 255,
        g: Math.floor((1 - t) * 255),
        b: 0
      };
    }
  };

  const handleClear = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }
    if (onClear) {
      onClear();
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {pointCount} gaze points
            </Typography>
            {onClear && (
              <Button
                variant="outlined"
                size="small"
                onClick={handleClear}
                disabled={pointCount === 0}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Box>

        <Box
          sx={{
            position: 'relative',
            width: width,
            height: height,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            backgroundColor: 'background.default'
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{ display: 'block' }}
          />
        </Box>

        {/* Legend */}
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            Low
          </Typography>
          <Box
            sx={{
              width: 200,
              height: 20,
              background: 'linear-gradient(to right, rgb(0,0,255), rgb(0,255,255), rgb(0,255,0), rgb(255,255,0), rgb(255,0,0))',
              borderRadius: 1
            }}
          />
          <Typography variant="caption" color="text.secondary">
            High
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default GazeHeatmap;
