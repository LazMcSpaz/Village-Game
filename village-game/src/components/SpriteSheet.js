import React, { useState, useEffect, useRef } from 'react';

/**
 * SpriteSheet - renders an animated sprite from a horizontal sprite sheet.
 *
 * Props:
 *   src - imported image (sprite sheet)
 *   frameWidth - width of a single frame (default 100)
 *   frameHeight - height of a single frame (default 100)
 *   frameCount - number of frames in the sheet
 *   fps - frames per second (default 8)
 *   scale - display scale multiplier (default 1)
 *   flipX - mirror horizontally (default false)
 *   loop - whether to loop (default true)
 *   playing - whether animation is playing (default true)
 *   onAnimationEnd - callback when non-looping animation finishes
 *   style - additional container styles
 */
export default function SpriteSheet({
  src,
  frameWidth = 100,
  frameHeight = 100,
  frameCount,
  fps = 8,
  scale = 1,
  flipX = false,
  loop = true,
  playing = true,
  onAnimationEnd,
  style = {},
}) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const ms = 1000 / fps;
    intervalRef.current = setInterval(() => {
      setFrame(prev => {
        const next = prev + 1;
        if (next >= frameCount) {
          if (loop) return 0;
          if (onAnimationEnd) onAnimationEnd();
          return prev; // stay on last frame
        }
        return next;
      });
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, fps, frameCount, loop, onAnimationEnd]);

  // Reset frame when src changes
  useEffect(() => {
    setFrame(0);
  }, [src]);

  const displayW = frameWidth * scale;
  const displayH = frameHeight * scale;

  return (
    <div
      style={{
        width: displayW,
        height: displayH,
        overflow: 'hidden',
        transform: flipX ? 'scaleX(-1)' : 'none',
        imageRendering: 'pixelated',
        ...style,
      }}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        style={{
          width: frameCount * frameWidth * scale,
          height: displayH,
          marginLeft: -frame * displayW,
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
}
