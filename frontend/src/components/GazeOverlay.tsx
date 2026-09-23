import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { GazeData } from '../types/gaze.types';

interface GazeOverlayProps {
  currentGaze: GazeData | null;
  isTracking: boolean;
  showTrail?: boolean;
  trailLength?: number;
}

const GazeOverlay: React.FC<GazeOverlayProps> = ({
  currentGaze,
  isTracking,
  showTrail = true,
  trailLength = 10,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<GazeData[]>([]);

  useEffect(() => {
    if (!isTracking || !currentGaze) return;

    // Add to trail
    trailRef.current.push(currentGaze);
    if (trailRef.current.length > trailLength) {
      trailRef.current.shift();
    }

    // Draw on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showTrail && trailRef.current.length > 1) {
      // Draw trail
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.lineWidth = 2;

      trailRef.current.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });

      ctx.stroke();
    }

    // Draw current gaze point
    ctx.beginPath();
    ctx.arc(currentGaze.x, currentGaze.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentGaze, isTracking, showTrail, trailLength]);

  // Clear trail when tracking stops
  useEffect(() => {
    if (!isTracking) {
      trailRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }
  }, [isTracking]);

  if (!isTracking) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default GazeOverlay;
