import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Season, AxialTilt } from '../types';
import { SEASON_DATA, MERIDIAN_ALTITUDES, TILT_EXPLANATIONS, SEOUL_LATITUDE } from '../constants';
import Tooltip from './Tooltip';

const ORBIT_RX = 220; // Decreased to prevent text clipping
const ORBIT_RY = 100; // Decreased to prevent text clipping
const ORBIT_CX = 300;
const ORBIT_CY = 150;
const EARTH_RADIUS = 30; // Increased earth size

const getEarthPosition = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = ORBIT_CX + ORBIT_RX * Math.cos(rad);
    const y = ORBIT_CY + ORBIT_RY * Math.sin(rad);
    return { x, y };
};

const SmilingSun: React.FC = () => (
    <g transform={`translate(${ORBIT_CX}, ${ORBIT_CY})`}>
        <circle r="40" fill="url(#sun-gradient)" />
        <defs>
            <radialGradient id="sun-gradient">
                <stop offset="0%" stopColor="#FFD700" />
                <stop offset="100%" stopColor="#FFA500" />
            </radialGradient>
        </defs>
        <circle cx="-12" cy="-5" r="3" fill="black" />
        <circle cx="12" cy="-5" r="3" fill="black" />
        <path d="M -15 10 Q 0 25 15 10" stroke="black" strokeWidth="2" fill="none" />
    </g>
);

const TiltedEarth: React.FC = () => (
    <g>
        <circle r={EARTH_RADIUS} fill="#4A90E2" />
        <path d="M -20 -20 C 20 -10, -20 10, 20 20" stroke="#2E7D32" strokeWidth="3" fill="none" opacity="0.7" />
        <line
            x1={-EARTH_RADIUS}
            y1={0}
            x2={EARTH_RADIUS}
            y2={0}
            stroke="white"
            strokeWidth="1"
            strokeDasharray="3,3"
            opacity="0.7"
        />
        <line
            x1="0"
            y1={-EARTH_RADIUS-10}
            x2="0"
            y2={EARTH_RADIUS+10}
            stroke="white"
            strokeWidth="2"
            strokeDasharray="2,2"
        />
    </g>
);

interface ControlButtonProps {
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}
const ControlButton: React.FC<ControlButtonProps> = ({ onClick, isActive, children }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 ${
        isActive
          ? 'bg-yellow-400 text-gray-900 shadow-lg scale-105'
          : 'bg-gray-700 text-white hover:bg-gray-600'
      }`}
    >
      {children}
    </button>
);


const Simulation: React.FC = () => {
  const [axialTilt, setAxialTilt] = useState<AxialTilt>(23.5);
  const [season, setSeason] = useState<Season>(Season.Spring);
  const [earthAngle, setEarthAngle] = useState<number>(SEASON_DATA[Season.Spring].angle);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const meridianAltitude = useMemo(() => {
    // Find the current season based on the closest angle, even while dragging
    const seasonAngles = Object.values(SEASON_DATA).map(s => ({ seasonKey: Object.keys(SEASON_DATA).find(key => SEASON_DATA[key as Season].angle === s.angle) as Season, angle: s.angle }));
    const closestSeason = seasonAngles.reduce((prev, curr) => 
        (Math.abs(curr.angle - earthAngle) < Math.abs(prev.angle - earthAngle) ? curr : prev)
    );
    setSeason(closestSeason.seasonKey);
    return MERIDIAN_ALTITUDES[axialTilt][closestSeason.seasonKey];
  }, [axialTilt, earthAngle]);

   const handleSeasonClick = (s: Season) => {
        setSeason(s);
        setEarthAngle(SEASON_DATA[s].angle);
    };

    const handleTiltClick = (tilt: AxialTilt) => {
        setAxialTilt(tilt);
    };

    const earthPosition = getEarthPosition(earthAngle);
    
    // The visual tilt of the axis, which is constant on the screen.
    const visualTilt = axialTilt; 

    // Calculates Korea's position on the Earth graphic.
    const displayKoreaPosition = useMemo(() => {
        const latRad = (SEOUL_LATITUDE * Math.PI) / 180;

        switch (season) {
            case Season.Spring:
            case Season.Autumn:
                // Per user request, place the dot 1/4 of the way up the central axis
                // for both tilt modes.
                return { x: 0, y: -EARTH_RADIUS / 4 };

            case Season.Summer:
                // Summer is on the left of the orbit, so the sun-facing side is on the right
                // of the Earth's local coordinates. This is consistent for both tilt modes.
                return {
                    x: EARTH_RADIUS * Math.cos(latRad),
                    y: -EARTH_RADIUS * Math.sin(latRad),
                };
            
            case Season.Winter:
                // Winter is on the right of the orbit, so the sun-facing side is on the left
                // of the Earth's local coordinates. This is consistent for both tilt modes,
                // as the group's rotation handles the tilt effect.
                return {
                    x: -EARTH_RADIUS * Math.cos(latRad),
                    y: -EARTH_RADIUS * Math.sin(latRad),
                };

            default:
                // Should not happen
                return { x: 0, y: 0 };
        }
    }, [season]);

    // Calculates the absolute screen coordinates for the end of the sunlight line.
    const sunlightLineEnd = useMemo(() => {
        // This calculates the final on-screen position of the red dot
        // by applying the group's rotation and translation.
        const { x, y } = displayKoreaPosition;
        const rotAngleRad = (visualTilt * Math.PI) / 180;
        const cosA = Math.cos(rotAngleRad);
        const sinA = Math.sin(rotAngleRad);

        const rotatedX = x * cosA - y * sinA;
        const rotatedY = x * sinA + y * cosA;

        return {
            x: earthPosition.x + rotatedX,
            y: earthPosition.y + rotatedY,
        };
    }, [earthPosition, displayKoreaPosition, visualTilt]);


    const getAngleFromCoords = (x: number, y: number) => {
        const dx = x - ORBIT_CX;
        const dy = y - ORBIT_CY;
        let angle = Math.atan2(dy / ORBIT_RY, dx / ORBIT_RX) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        return angle;
    };
    
    const snapToSeason = useCallback((angle: number) => {
        const seasonAngles = Object.values(SEASON_DATA).map(s => s.angle);
        
        const distance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

        let closestAngle = seasonAngles[0];
        let minDistance = distance(angle, closestAngle);

        for (const sAngle of seasonAngles) {
            const d = distance(angle, sAngle);
            if (d < minDistance) {
                minDistance = d;
                closestAngle = sAngle;
            }
        }

        const newSeason = Object.values(Season).find(s => SEASON_DATA[s].angle === closestAngle) || Season.Spring;
        setSeason(newSeason);
        setEarthAngle(closestAngle);
    }, []);

    const getMousePosition = (e: React.MouseEvent | MouseEvent) => {
        if (!svgRef.current) return {x: 0, y: 0};
        const CTM = svgRef.current.getScreenCTM();
        if(!CTM) return {x: 0, y: 0};
        return {
          x: (e.clientX - CTM.e) / CTM.a,
          y: (e.clientY - CTM.f) / CTM.d
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      const pos = getMousePosition(e);
      const dist = Math.sqrt(Math.pow(pos.x - earthPosition.x, 2) + Math.pow(pos.y - earthPosition.y, 2));
      if (dist <= EARTH_RADIUS) {
          setIsDragging(true);
      }
    };
    
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !svgRef.current) return;
        const pos = getMousePosition(e as any);
        const angle = getAngleFromCoords(pos.x, pos.y);
        setEarthAngle(angle);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        snapToSeason(earthAngle);
    }, [isDragging, earthAngle, snapToSeason]);
    
    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const getTextPosition = (s: Season, pos: { x: number, y: number }): { x: number; y: number; anchor: "middle" | "end" | "start" } => {
        switch (s) {
            case Season.Spring: return { x: pos.x, y: pos.y + 40, anchor: 'middle' };
            case Season.Summer: return { x: pos.x - 45, y: pos.y + 5, anchor: 'end' };
            case Season.Autumn: return { x: pos.x, y: pos.y - 30, anchor: 'middle' };
            case Season.Winter: return { x: pos.x + 45, y: pos.y + 5, anchor: 'start' };
            default: return { ...pos, anchor: 'middle' };
        }
    };

  return (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orbital Simulation */}
        <div className="lg:col-span-2 bg-black bg-opacity-20 rounded-lg p-4 flex justify-center items-center">
          <svg ref={svgRef} viewBox="0 0 600 300" onMouseDown={handleMouseDown} className="cursor-grab active:cursor-grabbing">
            <ellipse cx={ORBIT_CX} cy={ORBIT_CY} rx={ORBIT_RX} ry={ORBIT_RY} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="5,5"/>
            
            <line
                x1={ORBIT_CX}
                y1={ORBIT_CY}
                x2={sunlightLineEnd.x}
                y2={sunlightLineEnd.y}
                stroke="yellow"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.8"
            />

            <SmilingSun />

            {Object.values(Season).map(s => {
                const pos = getEarthPosition(SEASON_DATA[s].angle);
                const textPos = getTextPosition(s, pos);
                const nameParts = SEASON_DATA[s].name.match(/(.+?)\s(\(.+?\))/);
                const mainName = nameParts ? nameParts[1] : SEASON_DATA[s].name;
                const subName = nameParts ? nameParts[2] : '';

                return (
                    <g key={s}>
                        <circle cx={pos.x} cy={pos.y} r="5" fill={season === s ? '#FFD700' : '#4A90E2'} />
                        <text x={textPos.x} y={textPos.y} textAnchor={textPos.anchor} fill="white" fontSize="14" fontWeight="bold">
                            <tspan>{mainName}</tspan>
                            <tspan x={textPos.x} dy="1.2em">{subName}</tspan>
                        </text>
                    </g>
                )
            })}
            
            <g transform={`translate(${earthPosition.x}, ${earthPosition.y}) rotate(${visualTilt})`}>
                <TiltedEarth />
                <circle cx={displayKoreaPosition.x} cy={displayKoreaPosition.y} r="4" fill="#E53E3E" stroke="white" strokeWidth="1" />
            </g>
          </svg>
        </div>

        {/* Info & Controls Panel */}
        <div className="flex flex-col gap-4">
          {/* Altitude View */}
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <h3 className="text-center font-bold text-lg mb-2">
                <Tooltip text="태양이 하루 중 가장 높이 떴을 때의 높이(각도)예요.">
                    <span className="border-b-2 border-yellow-400 border-dashed">한국의 태양 남중고도</span>
                </Tooltip>
            </h3>
            <div className="flex justify-center items-center h-48">
              <svg viewBox="0 0 240 140">
                  {(() => {
                      const maxHeight = 100; // Corresponds to the highest point for 90 deg altitude
                      const ry = (meridianAltitude / 90) * maxHeight;
                      
                      const sunPathD = ry < 1 
                          ? "M 20 120 L 220 120" // Draw a flat line if altitude is (near) zero
                          : `M 20 120 A 100 ${ry} 0 0 1 220 120`;

                      const sunCx = 120;
                      const sunCy = 120 - ry;

                      return (
                          <>
                              {/* Guide path for max altitude */}
                              <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(255,255,255,0.3)" strokeDasharray="3,3" />
                              {/* Actual sun path for the current season */}
                              <path d={sunPathD} stroke="#FFD700" strokeWidth="3" fill="none" className="transition-all duration-500" />
                              {/* Sun circle at its peak (noon) */}
                              <circle cx={sunCx} cy={sunCy} r="8" fill="#FFD700" className="transition-all duration-500" />
                          </>
                      );
                  })()}
                  {/* Horizon line */}
                  <path d="M 0 120 L 240 120" stroke="white" strokeWidth="2" />
                  {/* Observer icon */}
                  <path d="M 110 120 L 110 110 L 130 110 L 130 120 M 120 110 L 120 100 L 125 95 L 115 95 Z" fill="#90A4AE" />
                  {/* Altitude text */}
                  <text x="120" y="70" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" className="transition-all duration-500">{meridianAltitude.toFixed(1)}°</text>
              </svg>
            </div>
          </div>
          
          {/* Explanation */}
          <div className="bg-black bg-opacity-20 rounded-lg p-4 text-center min-h-[100px] flex flex-col justify-center">
            <p className="text-gray-300">{TILT_EXPLANATIONS[axialTilt]}</p>
            {axialTilt === 23.5 && <p className="mt-2 text-yellow-300 font-bold">{SEASON_DATA[season].description}</p>}
          </div>

          {/* Controls */}
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <div className="flex flex-col gap-4">
               <div>
                    <h4 className="font-bold mb-2 text-center">
                       <Tooltip text="지구가 스스로 도는 중심축이에요. 이 축이 기울어져 있어요.">
                            <span className="border-b-2 border-yellow-400 border-dashed">자전축 기울기</span>
                        </Tooltip>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <ControlButton onClick={() => handleTiltClick(0)} isActive={axialTilt === 0}>기울기 없음 (0°)</ControlButton>
                        <ControlButton onClick={() => handleTiltClick(23.5)} isActive={axialTilt === 23.5}>현재 기울기 (23.5°)</ControlButton>
                    </div>
                </div>
                <div className={axialTilt !== 23.5 ? 'opacity-50 pointer-events-none' : ''}>
                    <h4 className="font-bold mb-2 text-center">계절 선택</h4>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(SEASON_DATA) as Season[]).map(s => (
                            <ControlButton key={s} onClick={() => handleSeasonClick(s)} isActive={season === s}>
                                {SEASON_DATA[s].name}
                            </ControlButton>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulation;