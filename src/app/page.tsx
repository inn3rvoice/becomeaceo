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
  const [gameState, setGameState] = useState<'playing' | 'caught' | 'won'>('playing');
  const [careerLevel, setCareerLevel] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightState>({ x: 20, y: 20, dx: 2, dy: 1.5 });
  const [showAnimation, setShowAnimation] = useState(false);
  const [hugAnimationFrame, setHugAnimationFrame] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [currentTooltip, setCurrentTooltip] = useState('');
  const [caughtAnimationFrame, setCaughtAnimationFrame] = useState(1);
  const [caughtAnimationPhase, setCaughtAnimationPhase] = useState<'initial' | 'loop'>('initial');
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const hugAnimationRef = useRef<number>();
  const caughtAnimationRef = useRef<number>();
  const hugStartTime = useRef<number>(0);
  
  const PLAYER_POSITION_X = 50; // Percentage from left where player is positioned
  const PLAYER_POSITION_Y = 65; // Percentage from top where player is positioned (moved up)
  const SPOTLIGHT_RADIUS = 5.6; // Percentage radius of spotlight (30% smaller: 8 * 0.7)
  const PLAYER_WIDTH = 8; // Percentage width of player character (matches w-10 class ~40px)
  const PLAYER_HEIGHT = 18; // Percentage height of player character (extended by 1/5 more to cover full image)
  const MIN_HUG_TIME = 1000; // Minimum hug time in ms
  const [debugMode, setDebugMode] = useState(false); // Toggle debug mode with button
  
  // Career progression levels
  const CAREER_LEVELS = [
    "Intern", "Associate", "Sr. Individual Contributor", "Team Lead", 
    "Manager", "Sr. Manager", "Director", "VP", "SVP", "CEO"
  ];
  
  // Tooltip humor pool
  const TOOLTIPS = [
    "Legal has joined the Zoom.",
    "HR just enabled screen recording.",
    "Slack DMs are being archived.",
    "Compliance is drafting a docu-sign.",
    "Your relationship is under quarterly review.",
    "Someone just anonymously @'d you.",
    "Every hug delays your Series B vesting.",
    "You're one kiss from CTO… of Consequences.",
    "This is not how you impress the board.",
    "Real CEOs don't get caught hugging.",
    "Do you want to end up in a shareholder memo?",
    "You're 3 dodges away from your own TED Talk.",
    "There's a Google Doc about you right now.",
    "Karen from Ops is watching this.",
    "Your calendar just got suspiciously busy.",
    "Someone created a Notion page titled 'Incident 🧾'",
    "LinkedIn just suggested a PR crisis manager.",
    "CEO visibility increasing… dangerously.",
    "HR romance policies last updated: 2 years ago. Uh oh.",
    "The spotlight sees everything… including feelings.",
    "This is how 'dating in stealth mode' ends.",
    "Cupid's arrow now tracked via Salesforce.",
    "Bro you're on the Jumbotron.",
    "HR saw that. Twice.",
    "This is why you're not in the founder circle.",
    "Someone just clipped that for Slack.",
    "You're getting memed in #watercooler."
  ];
  
  const getSpotlightSpeed = useCallback(() => {
    return 0.5 + careerLevel * 0.25; // Gets faster with each career level
  }, [careerLevel]);
  
  const getCurrentTitle = () => CAREER_LEVELS[careerLevel] || "CEO";
  
  const getRandomTooltip = () => TOOLTIPS[Math.floor(Math.random() * TOOLTIPS.length)];
  
  const isSpotlightOnPlayer = useCallback(() => {
    if (!gameAreaRef.current) return false;
    
    // Get actual dimensions of game area
    const rect = gameAreaRef.current.getBoundingClientRect();
    const gameWidth = rect.width;
    const gameHeight = rect.height;
    
    // Convert percentage positions to actual pixels
    const circleXPx = (spotlight.x / 100) * gameWidth;
    const circleYPx = (spotlight.y / 100) * gameHeight;
    
    // Calculate actual radius in pixels - spotlight uses width percentage with aspect-ratio 1:1
    // So the radius in pixels is based on the width percentage of the game area width
    const radiusPx = (SPOTLIGHT_RADIUS / 100) * gameWidth;
    
    // Player rectangle bounds in pixels
    const playerXPx = (PLAYER_POSITION_X / 100) * gameWidth;
    const playerYPx = ((PLAYER_POSITION_Y - 5) / 100) * gameHeight; // Match the adjusted image position
    const playerWidthPx = (PLAYER_WIDTH / 100) * gameWidth;
    const playerHeightPx = (PLAYER_HEIGHT / 100) * gameHeight;
    
    const rectLeft = playerXPx - playerWidthPx / 2;
    const rectRight = playerXPx + playerWidthPx / 2;
    const rectTop = playerYPx; // Top-aligned like the image
    const rectBottom = playerYPx + playerHeightPx;
    
    // Check if circle overlaps with rectangle using closest point method
    const closestX = Math.max(rectLeft, Math.min(circleXPx, rectRight));
    const closestY = Math.max(rectTop, Math.min(circleYPx, rectBottom));
    
    const dx = circleXPx - closestX;
    const dy = circleYPx - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    return distance <= radiusPx;
  }, [spotlight.x, spotlight.y]);
  
  const startHugging = () => {
    if (gameState !== 'playing') return;
    setIsHugging(true);
    hugStartTime.current = Date.now();
    
    // Start hugging animation - cycle through 15 frames
    const animateHug = () => {
      setHugAnimationFrame(prev => prev >= 15 ? 1 : prev + 1);
      hugAnimationRef.current = setTimeout(animateHug, 100); // Switch every 100ms for smooth animation
    };
    animateHug();
  };
  
  const stopHugging = () => {
    if (!isHugging || gameState !== 'playing') return;
    
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
    
    // Hide animation after short delay
    setTimeout(() => {
      setShowAnimation(false);
      // Don't restart spotlight - let it continue on its trajectory
    }, 500);
  };
  
  const resetGame = () => {
    setGameState('playing');
    setCareerLevel(0);
    setRomancePoints(0);
    setSpotlight({ x: 20, y: 20, dx: 2, dy: 1.5 });
    setIsHugging(false);
    setShowAnimation(false);
    setHugAnimationFrame(1);
    setShowLevelUp(false);
    setCurrentTooltip(getRandomTooltip());
    setCaughtAnimationFrame(1);
    setCaughtAnimationPhase('initial');
    
    // Clear any running animations
    if (hugAnimationRef.current) {
      clearTimeout(hugAnimationRef.current);
    }
    if (caughtAnimationRef.current) {
      clearTimeout(caughtAnimationRef.current);
    }
  };
  
  // Rotate tooltips every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTooltip(getRandomTooltip());
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Set initial tooltip
  useEffect(() => {
    setCurrentTooltip(getRandomTooltip());
  }, []);
  
  // Debug: Manual spotlight control
  useEffect(() => {
    if (!debugMode) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        // Calculate mouse position as percentage, ensuring spotlight center follows mouse exactly
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        // Clamp to ensure spotlight doesn't go outside bounds
        const clampedX = Math.max(SPOTLIGHT_RADIUS, Math.min(100 - SPOTLIGHT_RADIUS, x));
        const clampedY = Math.max(SPOTLIGHT_RADIUS, Math.min(100 - SPOTLIGHT_RADIUS, y));
        setSpotlight(prev => ({ ...prev, x: clampedX, y: clampedY }));
      }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const speed = 2;
      setSpotlight(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        switch(e.key) {
          case 'ArrowLeft':
            newX = Math.max(0, prev.x - speed);
            break;
          case 'ArrowRight':
            newX = Math.min(100, prev.x + speed);
            break;
          case 'ArrowUp':
            newY = Math.max(0, prev.y - speed);
            break;
          case 'ArrowDown':
            newY = Math.min(100, prev.y + speed);
            break;
        }
        
        return { ...prev, x: newX, y: newY };
      });
    };
    
    if (gameAreaRef.current) {
      gameAreaRef.current.addEventListener('mousemove', handleMouseMove);
    }
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (gameAreaRef.current) {
        gameAreaRef.current.removeEventListener('mousemove', handleMouseMove);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [debugMode]);
  
  // Game loop for spotlight movement
  useEffect(() => {
    if (gameState !== 'playing' || debugMode) return; // Disable auto movement in debug mode
    
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
  }, [gameState, getSpotlightSpeed, debugMode]);
  
  // Check for game over when hugging and spotlight hits
  useEffect(() => {
    if (isHugging && isSpotlightOnPlayer() && gameState === 'playing' && !showLevelUp && romancePoints < 100) {
      // Center spotlight over player hitbox center when caught
      setSpotlight(prev => ({
        ...prev,
        x: PLAYER_POSITION_X,
        y: PLAYER_POSITION_Y - 5 + PLAYER_HEIGHT / 2, // Center of the blue bounding box
      }));
      setGameState('caught');
    }
  }, [isHugging, isSpotlightOnPlayer, showLevelUp, gameState, romancePoints]);
  
  // Handle level progression when points reach 100
  useEffect(() => {
    if (romancePoints >= 100 && !showLevelUp && gameState === 'playing') {
      // Immediately move spotlight over the player hitbox center for dramatic effect
      setSpotlight(prev => ({
        ...prev,
        x: PLAYER_POSITION_X,
        y: PLAYER_POSITION_Y - 5 + PLAYER_HEIGHT / 2, // Center of the blue bounding box
      }));
      
      // Immediately trigger level progression
      if (careerLevel >= CAREER_LEVELS.length - 1) {
        setGameState('won'); // Reached CEO!
      } else {
        // Show level up animation
        setShowLevelUp(true);
        
        // Set a timeout to handle the level progression
        setTimeout(() => {
          setCareerLevel(prev => prev + 1);
          setRomancePoints(0); // Reset romance points
          setCurrentTooltip(getRandomTooltip()); // New random tooltip
          // Reset spotlight with new random position and faster speed
          setSpotlight({
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 10,
            dx: (Math.random() - 0.5) * 4,
            dy: (Math.random() - 0.5) * 4
          });
          setShowLevelUp(false);
        }, 2000);
      }
    }
  }, [romancePoints, showLevelUp, gameState, careerLevel]);
  
  // Romance points increase while hugging
  useEffect(() => {
    if (!isHugging || gameState !== 'playing' || showLevelUp) return; // Stop during level up
    
    const interval = setInterval(() => {
      setRomancePoints(prev => {
        // Don't increment if level up is already showing
        if (showLevelUp) return prev;
        
        // Cap at 100 points
        if (prev >= 100) return 100;
        
        return prev + 1;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isHugging, gameState, careerLevel, showLevelUp]);
  
  // Romance points decay when not hugging
  useEffect(() => {
    if (isHugging || gameState !== 'playing' || showLevelUp) return; // Don't decay while hugging, during level up, or when game over
    
    const decayInterval = setInterval(() => {
      setRomancePoints(prev => {
        if (prev <= 0) return 0; // Don't go below 0
        return prev - 1; // Slowly decay points
      });
    }, 200); // Decay every 200ms (slower than gain rate)
    
    return () => clearInterval(decayInterval);
  }, [isHugging, gameState, showLevelUp]);
  
  // Caught animation: play 1-7 once, then loop 7-23 forever
  useEffect(() => {
    if (gameState !== 'caught') return;
    
    let currentFrame = 1;
    let isInLoop = false;
    
    const animateCaught = () => {
      setCaughtAnimationFrame(currentFrame);
      
      if (!isInLoop) {
        // Initial phase: play frames 1-7 once
        if (currentFrame >= 7) {
          isInLoop = true;
        }
        currentFrame++;
      } else {
        // Loop phase: loop frames 7-23 forever
        if (currentFrame >= 23) {
          currentFrame = 7; // Loop back to frame 7
        } else {
          currentFrame++;
        }
      }
      
      caughtAnimationRef.current = setTimeout(animateCaught, 100); // 100ms per frame
    };
    
    // Start the animation
    setCaughtAnimationFrame(1);
    setCaughtAnimationPhase('initial');
    animateCaught();
    
    return () => {
      if (caughtAnimationRef.current) {
        clearTimeout(caughtAnimationRef.current);
      }
    };
  }, [gameState]);
  
  const getEndMessage = () => {
    switch (gameState) {
      case 'caught':
        return {
          title: "YOU WENT VIRAL! 📹",
          subtitle: "The kiss cam got you! Check Slack on Monday...",
          buttonText: "Try Again Before It's On LinkedIn"
        };
      case 'won':
        return {
          title: "CONGRATULATIONS, CEO! 🎉",
          subtitle: `You've reached the top! Your love life survived the corporate ladder.`,
          buttonText: "Start New Career"
        };
      default:
        return { title: "", subtitle: "", buttonText: "" };
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full h-[800px] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
          <div className="relative">
            {/* Debug Toggle Button */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`absolute top-0 right-0 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                debugMode 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {debugMode ? '🔧 DEBUG ON' : '🎮 PLAY MODE'}
            </button>
            
            <div className="text-center">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight">BECOME A CEO</h1>
              <div className="text-base font-semibold text-gray-700 mt-2 flex items-center justify-center gap-2">
                <span className="text-blue-500">📊</span>
                <span>Current Title:</span>
                <span className="text-indigo-600 font-bold">{getCurrentTitle()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game Area */}
        <div 
          ref={gameAreaRef}
          className="relative h-80 bg-cover bg-center bg-no-repeat overflow-hidden bg-gray-800 flex-shrink-0"
          style={{ backgroundImage: 'url(/crowd_v2.png)' }}
        >
          {/* Spotlight - Perfect circle */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${spotlight.x}%`,
              top: `${spotlight.y}%`,
              width: `${SPOTLIGHT_RADIUS * 2}%`,
              aspectRatio: '1 / 1',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 240, 150, 0.9) 30%, rgba(255, 200, 100, 0.7) 70%, rgba(255, 150, 0, 0.3) 100%)',
              boxShadow: `0 0 80px rgba(255, 220, 100, 0.8), inset 0 0 40px rgba(255, 255, 255, 0.4)`,
              border: '4px solid rgba(255, 255, 255, 0.9)',
            }}
          />
          
          {/* Debug: Spotlight exact boundary */}
          {debugMode && (
            <div
              className="absolute rounded-full pointer-events-none border-4 border-red-600 z-20"
              style={{
                left: `${spotlight.x}%`,
                top: `${spotlight.y}%`,
                width: `${SPOTLIGHT_RADIUS * 2}%`,
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                boxShadow: '0 0 0 2px white',
              }}
            />
          )}
          
          {/* Debug: Spotlight center point */}
          {debugMode && (
            <div
              className="absolute w-2 h-2 bg-red-600 pointer-events-none rounded-full"
              style={{
                left: `${spotlight.x}%`,
                top: `${spotlight.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          
          {/* Debug: Visual spotlight center (should match red dot) */}
          {debugMode && (
            <div
              className="absolute w-2 h-2 bg-yellow-400 pointer-events-none rounded-full z-30"
              style={{
                left: `${spotlight.x - SPOTLIGHT_RADIUS + SPOTLIGHT_RADIUS}%`,
                top: `${spotlight.y - SPOTLIGHT_RADIUS + SPOTLIGHT_RADIUS}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          
          
          {/* Debug: Expanded collision zone */}
          {debugMode && (
            <div
              className="absolute border-2 border-green-500 pointer-events-none z-15 opacity-40"
              style={{
                left: `${PLAYER_POSITION_X - PLAYER_WIDTH / 2 - SPOTLIGHT_RADIUS}%`,
                top: `${PLAYER_POSITION_Y - PLAYER_HEIGHT / 2 - SPOTLIGHT_RADIUS}%`,
                width: `${PLAYER_WIDTH + SPOTLIGHT_RADIUS * 2}%`,
                height: `${PLAYER_HEIGHT + SPOTLIGHT_RADIUS * 2}%`,
                backgroundColor: 'rgba(0, 255, 0, 0.1)',
              }}
            />
          )}
          
          {/* Debug: Player hitbox rectangle */}
          {debugMode && (
            <div
              className="absolute border-4 border-blue-600 pointer-events-none z-20"
              style={{
                left: `${PLAYER_POSITION_X - PLAYER_WIDTH / 2}%`,
                top: `${PLAYER_POSITION_Y - 5}%`,
                width: `${PLAYER_WIDTH}%`,
                height: `${PLAYER_HEIGHT}%`,
                backgroundColor: isSpotlightOnPlayer() ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.2)',
                boxShadow: '0 0 0 2px white',
              }}
            />
          )}
          
          {/* Debug: Player center point */}
          {debugMode && (
            <div
              className="absolute w-1 h-1 bg-blue-600 pointer-events-none z-20"
              style={{
                left: `${PLAYER_POSITION_X}%`,
                top: `${PLAYER_POSITION_Y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
          
          {/* Player Characters */}
          <div 
            className="absolute transform -translate-x-1/2 z-10"
            style={{ 
              left: `${PLAYER_POSITION_X}%`, 
              top: `${PLAYER_POSITION_Y - 5}%` 
            }}
          >
            <img
              src={
                gameState === 'caught' 
                  ? `/caught/output_${caughtAnimationFrame.toString().padStart(4, '0')}.png`
                  : isHugging 
                    ? `/output_${hugAnimationFrame.toString().padStart(4, '0')}.png` 
                    : "/output_0001.png"
              }
              alt="CEO and HR"
              className="w-10 object-contain transition-all duration-300 drop-shadow-xl"
            />
          </div>
          
          {/* Kiss Cam Label */}
          {isSpotlightOnPlayer() && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold animate-pulse shadow-lg">
              📹 KISS CAM
            </div>
          )}
          
          {/* Career Promotion Notification */}
          {showLevelUp && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="bg-white text-gray-900 px-8 py-6 rounded-2xl text-center shadow-2xl animate-bounce">
                <div className="text-2xl font-bold mb-2">PROMOTED! 🎉</div>
                <div className="text-lg text-gray-700">{getCurrentTitle()}</div>
                <div className="text-xs text-gray-500 mt-1">Spotlight getting faster...</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Side Panel */}
        <div className="bg-white p-6 space-y-4 flex-1 flex flex-col min-h-0">
          {/* Romance Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                You & HR ❤️
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-pink-400 to-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(romancePoints, 100)}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">{Math.min(romancePoints, 100)}/100</div>
          </div>
          
          {/* Controls */}
          <div className="flex-1 flex flex-col justify-between">
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
              
              {/* Career Progress */}
              <div className="text-center">
                <span className="text-sm text-gray-600">{getCurrentTitle()}</span>
                <div className="text-xs text-gray-400 mt-1">
                  {careerLevel + 1}/{CAREER_LEVELS.length} to CEO
                </div>
              </div>
              
              
              {/* Debug Info */}
              {debugMode && (
                <div className="text-xs text-gray-500 space-y-1 p-2 bg-gray-100 rounded">
                  <div className="text-blue-600 font-bold">🎮 MANUAL CONTROL:</div>
                  <div>• Mouse over game area to move spotlight</div>
                  <div>• Arrow keys for precise movement</div>
                  <div className="border-t pt-1 mt-2"></div>
                  <div>Spotlight: ({spotlight.x.toFixed(1)}, {spotlight.y.toFixed(1)}%)</div>
                  <div>Player: ({PLAYER_POSITION_X}, {PLAYER_POSITION_Y}%) Size: {PLAYER_WIDTH}x{PLAYER_HEIGHT}%</div>
                  <div className="font-bold">Distance (px): {(() => {
                    if (!gameAreaRef.current) return "N/A";
                    const rect = gameAreaRef.current.getBoundingClientRect();
                    const gameWidth = rect.width;
                    const gameHeight = rect.height;
                    
                    const circleXPx = (spotlight.x / 100) * gameWidth;
                    const circleYPx = (spotlight.y / 100) * gameHeight;
                    const radiusPx = (SPOTLIGHT_RADIUS / 100) * gameWidth;
                    
                    const playerXPx = (PLAYER_POSITION_X / 100) * gameWidth;
                    const playerYPx = (PLAYER_POSITION_Y / 100) * gameHeight;
                    const playerWidthPx = (PLAYER_WIDTH / 100) * gameWidth;
                    const playerHeightPx = (PLAYER_HEIGHT / 100) * gameHeight;
                    
                    const rectLeft = playerXPx - playerWidthPx / 2;
                    const rectRight = playerXPx + playerWidthPx / 2;
                    const rectTop = playerYPx - playerHeightPx / 2;
                    const rectBottom = playerYPx + playerHeightPx / 2;
                    
                    const closestX = Math.max(rectLeft, Math.min(circleXPx, rectRight));
                    const closestY = Math.max(rectTop, Math.min(circleYPx, rectBottom));
                    
                    const dx = circleXPx - closestX;
                    const dy = circleYPx - closestY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    return `${distance.toFixed(1)} (need ≤ ${radiusPx.toFixed(1)})`;
                  })()}</div>
                  <div className="font-bold">Collision: {isSpotlightOnPlayer() ? '🔴 HIT' : '🟢 SAFE'}</div>
                </div>
              )}
              </div>
            ) : (
              <div className="text-center space-y-4 flex flex-col justify-center h-full">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getEndMessage().title}</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mt-2">{getEndMessage().subtitle}</p>
                </div>
                <button
                  onClick={resetGame}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all duration-200"
                >
                  {getEndMessage().buttonText}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Bottom tooltip */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500 transition-all duration-500">💼 {currentTooltip}</p>
        </div>
      </div>
    </div>
  );
}
