"use client" 
import { useCurrentFrame, useVideoConfig, interpolate, spring, Sequence, Audio } from 'remotion';
import React from 'react';

const ActiveRecallVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // ============================================
  // SCENE 1: Concept Seeding (0-8s / 0-240 frames)
  // ============================================
  const scene1TitleOpacity = interpolate(
    frame,
    [0, 30, 210, 240],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const scene1TitleY = interpolate(
    frame,
    [0, 30],
    [20, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ============================================
  // SCENE 2: The Problem (8-18s / 240-540 frames)
  // ============================================
  const passiveReadingOpacity = interpolate(
    frame,
    [240, 270, 390, 420],
    [0, 1, 1, 0.3],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const memoryFailureOpacity = interpolate(
    frame,
    [420, 450, 510, 540],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ============================================
  // SCENE 3: Core Mechanism (18-40s / 540-1200 frames)
  // ============================================
  const brainOpacity = interpolate(
    frame,
    [540, 570],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Information flowing IN
  const infoInProgress = spring({
    frame: frame - 600,
    fps,
    config: { damping: 200 }
  });

  const infoInX = interpolate(
    infoInProgress,
    [0, 1],
    [-200, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Information being RETRIEVED
  const retrievalProgress = spring({
    frame: frame - 780,
    fps,
    config: { damping: 200 }
  });

  const retrievalY = interpolate(
    retrievalProgress,
    [0, 1],
    [0, -150],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Pathway strengthening visualization
  const pathwayStrength = interpolate(
    frame,
    [900, 1200],
    [1, 3],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ============================================
  // SCENE 4: Concrete Example (40-60s / 1200-1800 frames)
  // ============================================
  const questionOpacity = interpolate(
    frame,
    [1200, 1230, 1500, 1530],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const struggleOpacity = interpolate(
    frame,
    [1350, 1380, 1500, 1530],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const feedbackOpacity = interpolate(
    frame,
    [1530, 1560, 1770, 1800],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // ============================================
  // SCENE 5: Mental Model Lock-In (60-70s / 1800-2100 frames)
  // ============================================
  const takeawayOpacity = interpolate(
    frame,
    [1800, 1860, 2070, 2100],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a1a',
        width,
        height,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Audio narration - replace src with actual audio file path */}
      <Audio src="/audio/active-recall-narration.mp3" />

      {/* ============================================ */}
      {/* SCENE 1: Concept Seeding */}
      {/* ============================================ */}
      <Sequence from={0} durationInFrames={240}>
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: `translate(-50%, calc(-50% + ${scene1TitleY}px))`,
            opacity: scene1TitleOpacity,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 72, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            Active Recall
          </h1>
          <p style={{ fontSize: 24, fontWeight: 400, marginTop: 24, color: '#a0a0a0', maxWidth: 600 }}>
            Strengthens memory by forcing the brain to retrieve information instead of recognizing it
          </p>
        </div>
      </Sequence>

      {/* ============================================ */}
      {/* SCENE 2: The Problem */}
      {/* ============================================ */}
      <Sequence from={240} durationInFrames={300}>
        {/* Passive reading state */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: passiveReadingOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
          <div style={{ fontSize: 28, color: '#60a5fa' }}>Reading notes...</div>
          <div style={{ fontSize: 20, color: '#9ca3af', marginTop: 12 }}>
            "This looks familiar"
          </div>
        </div>

        {/* Memory failure state */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: memoryFailureOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontSize: 28, color: '#ef4444' }}>Book closed...</div>
          <div style={{ fontSize: 20, color: '#9ca3af', marginTop: 12 }}>
            "I can't remember"
          </div>
        </div>
      </Sequence>

      {/* ============================================ */}
      {/* SCENE 3: Core Mechanism */}
      {/* ============================================ */}
      <Sequence from={540} durationInFrames={660}>
        {/* Brain representation */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: brainOpacity,
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: '3px solid #6366f1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 80,
            }}
          >
            🧠
          </div>
        </div>

        {/* Information flowing IN (passive) */}
        {frame >= 600 && frame < 780 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${infoInX}px), -50%)`,
              fontSize: 32,
            }}
          >
            ℹ️
          </div>
        )}

        {/* Information being RETRIEVED (active) */}
        {frame >= 780 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, calc(-50% + ${retrievalY}px))`,
              fontSize: 32,
            }}
          >
            💡
          </div>
        )}

        {/* Pathway strengthening visualization */}
        {frame >= 900 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200,
              height: 200,
              borderRadius: '50%',
              border: `${pathwayStrength}px solid #10b981`,
              opacity: 0.6,
            }}
          />
        )}

        {/* Labels */}
        {frame >= 600 && frame < 780 && (
          <div
            style={{
              position: 'absolute',
              top: '70%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 20,
              color: '#9ca3af',
            }}
          >
            Pushing information in
          </div>
        )}

        {frame >= 780 && (
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: 20,
              color: '#10b981',
              textAlign: 'center',
            }}
          >
            Pulling information out<br/>
            <span style={{ fontSize: 16 }}>(strengthens pathway)</span>
          </div>
        )}
      </Sequence>

      {/* ============================================ */}
      {/* SCENE 4: Concrete Example */}
      {/* ============================================ */}
      <Sequence from={1200} durationInFrames={600}>
        {/* Question */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: questionOpacity,
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          <div style={{ fontSize: 32, fontWeight: 600, color: '#fbbf24' }}>
            What are the three types of long-term memory?
          </div>
        </div>

        {/* Struggle indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: struggleOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, color: '#9ca3af', fontStyle: 'italic' }}>
            (searching...)
          </div>
        </div>

        {/* Feedback */}
        <div
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: feedbackOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 20, color: '#10b981', lineHeight: 1.6 }}>
            ✓ Episodic<br/>
            ✓ Semantic<br/>
            ✓ Procedural
          </div>
          <div style={{ fontSize: 18, color: '#9ca3af', marginTop: 24 }}>
            That struggle = learning
          </div>
        </div>
      </Sequence>

      {/* ============================================ */}
      {/* SCENE 5: Mental Model Lock-In */}
      {/* ============================================ */}
      <Sequence from={1800} durationInFrames={300}>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: takeawayOpacity,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 600, color: '#ffffff' }}>
            If it feels hard,<br/>your brain is learning.
          </div>
        </div>
      </Sequence>
    </div>
  );
};
export default ActiveRecallVideo