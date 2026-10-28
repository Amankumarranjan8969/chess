import React, { useState, useEffect } from 'react';
import { Color, TimeControl } from '@chess/core';
import {
  Globe,
  Wifi,
  Copy,
  Check,
  Play,
  X,
  Users,
  Clock,
  Zap,
  Share2,
  Info,
} from 'lucide-react';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (tc: TimeControl, playerName: string, color?: Color) => Promise<string>;
  onJoinRoom: (roomId: string, playerName: string) => Promise<void>;
  initialRoomCode?: string;
  isJoined: boolean;
  currentRoomId?: string | null;
}

const PRESET_TIMES: { label: string; sub: string; tc: TimeControl }[] = [
  { label: '1 min', sub: 'Bullet (1+0)', tc: { initialMs: 60000, incrementMs: 0 } },
  { label: '3 | 2', sub: 'Blitz (3+2)', tc: { initialMs: 180000, incrementMs: 2000 } },
  { label: '5 | 3', sub: 'Rapid (5+3)', tc: { initialMs: 300000, incrementMs: 3000 } },
  { label: '10 min', sub: 'Standard (10+0)', tc: { initialMs: 600000, incrementMs: 0 } },
];

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  initialRoomCode = '',
  isJoined,
  currentRoomId,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>(initialRoomCode ? 'join' : 'create');
  const [playerName, setPlayerName] = useState<string>('Player');
  const [preferredColor, setPreferredColor] = useState<Color | 'random'>('w');
  const [selectedTimeIdx, setSelectedTimeIdx] = useState<number>(2);
  const [roomCodeInput, setRoomCodeInput] = useState<string>(initialRoomCode);

  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [lanIp, setLanIp] = useState<string>('localhost');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initialRoomCode if changed
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCodeInput(initialRoomCode);
      setTab('join');
    }
  }, [initialRoomCode]);

  // Fetch host LAN IP from server
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const serverBase =
          typeof window !== 'undefined'
            ? `${window.location.protocol}//${window.location.hostname}:4000`
            : 'http://localhost:4000';
        const res = await fetch(`${serverBase}/api/network-info`);
        if (res.ok) {
          const data = await res.json();
          if (data.lanIp) {
            setLanIp(data.lanIp);
          }
        }
      } catch {
        // Fallback to window.location.hostname
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          setLanIp(window.location.hostname);
        }
      }
    };
    if (isOpen) {
      fetchNetworkInfo();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeRoomCode = createdRoomId || currentRoomId;

  // Build the shareable Wi-Fi link
  // If user is accessing via localhost, use discovered LAN IP; else use existing hostname
  const hostDomain =
    typeof window !== 'undefined'
      ? window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? lanIp
        : window.location.hostname
      : lanIp;
  const webPort = typeof window !== 'undefined' && window.location.port ? window.location.port : '3000';
  const shareableWifiUrl = activeRoomCode
    ? `http://${hostDomain}:${webPort}/?room=${activeRoomCode}`
    : '';

  const handleCreate = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const tc = PRESET_TIMES[selectedTimeIdx].tc;
      const color = preferredColor === 'random' ? undefined : preferredColor;
      const roomId = await onCreateRoom(tc, playerName.trim() || 'Player', color);
      setCreatedRoomId(roomId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code) {
      setErrorMsg('Please enter a 6-letter room code');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await onJoinRoom(code, playerName.trim() || 'Player');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join room. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, isUrl: boolean) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isUrl) {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 text-stone-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#739552]/15 border border-[#739552]/30 flex items-center justify-center text-[#739552]">
              <Wifi size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                Local Wi-Fi & Online Play
              </h3>
              <p className="text-[11px] text-stone-500">
                Play in real-time with a friend on your local Wi-Fi or across the internet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Room Created Waiting View */}
        {activeRoomCode && !isJoined ? (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] animate-ping" />
                  Room Created — Waiting for Opponent
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-[#bbf7d0] text-[#15803d] rounded-md">
                  {activeRoomCode}
                </span>
              </div>

              {/* Direct Wi-Fi Share Link Box */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                  <Wifi size={12} className="text-[#739552]" />
                  Local Wi-Fi Invite Link (Share with your friend):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableWifiUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-stone-300 rounded-xl select-all focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(shareableWifiUrl, true)}
                    className="px-3 py-2 bg-[#739552] hover:bg-[#648346] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Quick instructions */}
              <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2.5 text-[11px] text-stone-600 flex items-start gap-2">
                <Info size={14} className="text-[#739552] shrink-0 mt-0.5" />
                <span>
                  Make sure your friend is connected to the <strong>same Wi-Fi network</strong>. When they open the link, the game will automatically launch and validate all moves in real time!
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Go to Chessboard
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs: Create Room vs Join Room */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-bold">
              <button
                onClick={() => setTab('create')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  tab === 'create'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Create Wi-Fi Match (Host)
              </button>
              <button
                onClick={() => setTab('join')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  tab === 'join'
                    ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Join Match (Friend)
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Player Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                Your Nickname
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#739552]/40"
              />
            </div>

            {tab === 'create' ? (
              <div className="flex flex-col gap-4">
                {/* Choose Color */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    Play As
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPreferredColor('w')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        preferredColor === 'w'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-white border border-stone-400" />
                      White
                    </button>
                    <button
                      onClick={() => setPreferredColor('b')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        preferredColor === 'b'
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-600" />
                      Black
                    </button>
                    <button
                      onClick={() => setPreferredColor('random')}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        preferredColor === 'random'
                          ? 'bg-[#739552] text-white border-[#739552] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>🎲</span> Random
                    </button>
                  </div>
                </div>

                {/* Time Control */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12} /> Time Control
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_TIMES.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTimeIdx(idx)}
                        className={`py-2 px-3 rounded-xl border text-left transition-all ${
                          selectedTimeIdx === idx
                            ? 'bg-[#739552]/10 border-[#739552] text-[#5f7d41]'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <div className="font-bold text-xs text-stone-900 flex items-center gap-1">
                          <Zap size={11} className={selectedTimeIdx === idx ? 'text-[#739552]' : 'text-stone-400'} />
                          {item.label}
                        </div>
                        <div className="text-[10px] text-stone-500">{item.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create Room Button */}
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
                >
                  <Share2 size={16} />
                  <span>{loading ? 'Generating Wi-Fi Room...' : 'Create Room & Get Wi-Fi Share Link'}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Room Code Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                    6-Letter Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. 7X8KP2"
                    className="px-3.5 py-3 rounded-xl border border-stone-300 bg-white font-mono text-base font-bold tracking-widest text-center text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#739552]/40"
                  />
                </div>

                {/* Join Button */}
                <button
                  onClick={handleJoin}
                  disabled={loading || !roomCodeInput.trim()}
                  className="w-full py-3.5 rounded-xl bg-[#739552] hover:bg-[#648346] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
                >
                  <Play size={16} fill="white" />
                  <span>{loading ? 'Joining Room...' : 'Join Wi-Fi Match'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
