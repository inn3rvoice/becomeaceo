'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpotlightState {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default function DodgeCam() {
  const [isHugging, setIsHugging] = useState(false);
  const [romancePoints, setRomancePoints] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'caught' | 'won' | 'dumped'>('playing');
  const [round, setRound] = useState(1);
  const [spotlight, setSpotlight] = useState<SpotlightState>({ x: 20, y: 20, dx: 2, dy: 1.5 });
  const [showAnimation, setShowAnimation] = useState(false);
  const [consecutiveEarlyHides, setConsecutiveEarlyHides] = useState(0);
  const [hugAnimationFrame, setHugAnimationFrame] = useState(1);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const hugAnimationRef = useRef<number>();
  const hugStartTime = useRef<number>(0);
  
  const PLAYER_POSITION_X = 50; // Percentage from left where player is positioned
  const PLAYER_POSITION_Y = 65; // Percentage from top where player is positioned (moved up)
  const SPOTLIGHT_RADIUS = 8; // Percentage radius of spotlight
  const MAX_ROUNDS = 5;
  const MIN_HUG_TIME = 1000; // Minimum hug time in ms
  
  const getSpotlightSpeed = useCallback(() => {
    return 0.5 + (round - 1) * 0.25; // Starts slower but still medium baseline, increases each round
  }, [round]);
  
  const isSpotlightOnPlayer = useCallback(() => {
    const distance = Math.sqrt(
      Math.pow(spotlight.x - PLAYER_POSITION_X, 2) + 
      Math.pow(spotlight.y - PLAYER_POSITION_Y, 2)
    );
    return distance < SPOTLIGHT_RADIUS; // Accurate hitbox matching spotlight size
  }, [spotlight.x, spotlight.y]);
  
  const startHugging = () => {
    if (gameState !== 'playing') return;
    setIsHugging(true);
    hugStartTime.current = Date.now();
    
    // Start hugging animation
    const animateHug = () => {
      setHugAnimationFrame(prev => prev === 1 ? 2 : 1);
      hugAnimationRef.current = setTimeout(animateHug, 500); // Switch every 500ms
    };
    animateHug();
  };
  
  const stopHugging = () => {
    if (!isHugging || gameState !== 'playing') return;
    
    const hugDuration = Date.now() - hugStartTime.current;
    setIsHugging(false);
    setShowAnimation(true);
    
    // Stop hugging animation
    if (hugAnimationRef.current) {
      clearTimeout(hugAnimationRef.current);
    }
    setHugAnimationFrame(1); // Reset to frame 1
    
    // Check if caught
    if (isSpotlightOnPlayer()) {
      setGameState('caught');
      return;
    }
    
    // Check if hug was too short
    if (hugDuration < MIN_HUG_TIME) {
      const newConsecutive = consecutiveEarlyHides + 1;
      setConsecutiveEarlyHides(newConsecutive);
      
      if (newConsecutive >= 3) {
        setGameState('dumped');
        return;
      }
    } else {
      setConsecutiveEarlyHides(0);
      // Award points based on hug duration and danger
      const basePoints = Math.floor(hugDuration / 100);
      const dangerBonus = isSpotlightOnPlayer() ? 2 : 1;
      setRomancePoints(prev => prev + basePoints * dangerBonus);
    }
    
    // Hide animation after short delay
    setTimeout(() => {
      setShowAnimation(false);
      
      // Next round or win
      if (round >= MAX_ROUNDS) {
        setGameState('won');
      } else {
        setRound(prev => prev + 1);
        // Reset spotlight with random position and direction
        setSpotlight({
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 10,
          dx: (Math.random() - 0.5) * 4,
          dy: (Math.random() - 0.5) * 4
        });
      }
    }, 500);
  };
  
  const resetGame = () => {
    setGameState('playing');
    setRound(1);
    setRomancePoints(0);
    setSpotlight({ x: 20, y: 20, dx: 2, dy: 1.5 });
    setIsHugging(false);
    setShowAnimation(false);
    setConsecutiveEarlyHides(0);
    setHugAnimationFrame(1);
    
    // Clear any running animation
    if (hugAnimationRef.current) {
      clearTimeout(hugAnimationRef.current);
    }
  };
  
  // Game loop for spotlight movement
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const animate = () => {
      setSpotlight(prev => {
        const speed = getSpotlightSpeed();
        let newX = prev.x + prev.dx * speed;
        let newY = prev.y + prev.dy * speed;
        let newDx = prev.dx;
        let newDy = prev.dy;
        
        // Bounce off edges with some randomness
        if (newX <= SPOTLIGHT_RADIUS || newX >= 100 - SPOTLIGHT_RADIUS) {
          newDx = -prev.dx + (Math.random() - 0.5) * 0.5;
          newX = Math.max(SPOTLIGHT_RADIUS, Math.min(100 - SPOTLIGHT_RADIUS, newX));
        }
        if (newY <= SPOTLIGHT_RADIUS || newY >= 100 - SPOTLIGHT_RADIUS) {
          newDy = -prev.dy + (Math.random() - 0.5) * 0.5;
          newY = Math.max(SPOTLIGHT_RADIUS, Math.min(100 - SPOTLIGHT_RADIUS, newY));
        }
        
        // Occasional random direction change
        if (Math.random() < 0.005) {
          newDx += (Math.random() - 0.5) * 1;
          newDy += (Math.random() - 0.5) * 1;
        }
        
        // Limit speed
        const maxSpeed = 3;
        if (Math.abs(newDx) > maxSpeed) newDx = Math.sign(newDx) * maxSpeed;
        if (Math.abs(newDy) > maxSpeed) newDy = Math.sign(newDy) * maxSpeed;
        
        return { x: newX, y: newY, dx: newDx, dy: newDy };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, getSpotlightSpeed]);
  
  // Check for game over when hugging and spotlight hits
  useEffect(() => {
    if (isHugging && isSpotlightOnPlayer()) {
      setGameState('caught');
    }
  }, [isHugging, isSpotlightOnPlayer]);
  
  // Romance points increase while hugging
  useEffect(() => {
    if (!isHugging || gameState !== 'playing') return;
    
    const interval = setInterval(() => {
      setRomancePoints(prev => prev + 1);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isHugging, gameState]);
  
  const getEndMessage = () => {
    switch (gameState) {
      case 'caught':
        return {
          title: "YOU WENT VIRAL! 📹",
          subtitle: "The kiss cam got you! Check Slack on Monday...",
          buttonText: "Try Again Before It's On LinkedIn"
        };
      case 'dumped':
        return {
          title: "SHE LEFT YOU! 💔",
          subtitle: "You played it too safe. HR moved to Procurement.",
          buttonText: "Win Her Back"
        };
      case 'won':
        return {
          title: "TRUE LOVE UNSCATHED! ❤️",
          subtitle: `Romance Level: ${romancePoints}. You made it through all rounds!`,
          buttonText: "Play Again"
        };
      default:
        return { title: "", subtitle: "", buttonText: "" };
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-100">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">DODGE THE KISS CAM</h1>
          </div>
        </div>
        
        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative h-80 bg-cover bg-center bg-no-repeat overflow-hidden bg-gray-800"
          style={{ backgroundImage: 'url(/crowd_v2.png)' }}
        >
          {/* Spotlight - Perfect circle */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${spotlight.x - SPOTLIGHT_RADIUS}%`,
              top: `${spotlight.y - SPOTLIGHT_RADIUS}%`,
              width: `${SPOTLIGHT_RADIUS * 2}%`,
              aspectRatio: '1 / 1',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 240, 150, 0.9) 30%, rgba(255, 200, 100, 0.7) 70%, rgba(255, 150, 0, 0.3) 100%)',
              boxShadow: `0 0 80px rgba(255, 220, 100, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.4)`,
              border: '4px solid rgba(255, 255, 255, 0.9)',
            }}
          />
          
          {/* Player Characters */}
          <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ 
              left: `${PLAYER_POSITION_X}%`, 
              top: `${PLAYER_POSITION_Y}%` 
            }}
          >
            <img
              src={isHugging ? `/useframe${hugAnimationFrame}.png` : "/useframe1.png"}
              alt="CEO and HR"
              className="w-20 h-20 object-cover transition-all duration-300 drop-shadow-xl"
            />
          </div>
          
          {/* Kiss Cam Label */}
          {isSpotlightOnPlayer() && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse shadow-lg">
              📹 KISS CAM
            </div>
          )}
        </div>
        
        {/* Side Panel */}
        <div className="bg-white p-6 space-y-4">
          {/* Romance Meter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                ❤️ Romance Meter
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-pink-400 to-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (romancePoints / 50) * 100)}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">{romancePoints}</div>
          </div>
          
          {/* Controls */}
          {gameState === 'playing' ? (
            <div className="space-y-3">
              <button
                onMouseDown={startHugging}
                onMouseUp={stopHugging}
                onTouchStart={startHugging}
                onTouchEnd={stopHugging}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all duration-200 select-none ${
                  isHugging 
                    ? 'bg-red-500 shadow-lg scale-[0.98]' 
                    : 'bg-blue-500 hover:bg-blue-600 shadow-md'
                }`}
              >
                HIDE
              </button>
              <button
                className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-medium text-sm"
                disabled
              >
                PAUSE
              </button>
              
              {/* Level indicator */}
              <div className="text-center">
                <span className="text-sm text-gray-600">Level {round} - Offsite</span>
              </div>
              
              {consecutiveEarlyHides > 0 && (
                <div className="text-xs text-orange-600 text-center">
                  ⚠️ Early exits: {consecutiveEarlyHides}/3
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-bold text-gray-900">{getEndMessage().title}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{getEndMessage().subtitle}</p>
              <button
                onClick={resetGame}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all duration-200"
              >
                {getEndMessage().buttonText}
              </button>
            </div>
          )}
        </div>
        
        {/* Bottom text */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">💼 Legal is watching...</p>
        </div>
      </div>
    </div>
  );
}
