import React, { useRef, useState, useEffect } from 'react';
import { DeckKey, OBSState } from '../types.ts';
import { KeyIcon } from './KeyIcon.tsx';
import { playTactileClick, playPanicSound, playAirhornSound, playChimeSound, triggerHaptic } from '../utils/soundEffects.ts';

interface KeyButtonProps {
  deckKey: DeckKey;
  obsState: OBSState;
  isEditMode: boolean;
  onExecute: (deckKey: DeckKey) => void;
  onEdit: (deckKey: DeckKey) => void;
}

export const KeyButton: React.FC<KeyButtonProps> = ({
  deckKey,
  obsState,
  isEditMode,
  onExecute,
  onEdit
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isFired, setIsFired] = useState(false);
  const pressTimer = useRef<any>(null);
  const hasTriggeredLongPress = useRef(false);

  const isEmpty = deckKey.actionType === 'none' && !deckKey.label;

  // Determine active states based on live OBS telemetry
  let isCurrentlyActive = false;
  let statusBadge: string | null = null;
  let badgeColor = 'bg-emerald-500';

  if (deckKey.actionType === 'obs_scene' && deckKey.actionTarget) {
    if (obsState.currentScene && obsState.currentScene.toLowerCase() === deckKey.actionTarget.toLowerCase()) {
      isCurrentlyActive = true;
      statusBadge = 'ACTIVA';
      badgeColor = 'bg-blue-500';
    }
  } else if (deckKey.actionType === 'obs_mute_toggle' && deckKey.actionTarget) {
    const input = obsState.audioInputs.find(
      i => i.inputName.toLowerCase() === deckKey.actionTarget?.toLowerCase()
    );
    if (input) {
      if (input.muted) {
        statusBadge = 'MUTE';
        badgeColor = 'bg-rose-500';
      } else {
        statusBadge = 'ON';
        badgeColor = 'bg-emerald-500';
      }
    }
  } else if (deckKey.actionType === 'obs_toggle_stream') {
    if (obsState.isStreaming) {
      isCurrentlyActive = true;
      statusBadge = 'LIVE';
      badgeColor = 'bg-red-600 animate-pulse';
    }
  } else if (deckKey.actionType === 'obs_toggle_record') {
    if (obsState.isRecording) {
      isCurrentlyActive = true;
      statusBadge = obsState.isRecordingPaused ? 'PAUSA' : 'REC';
      badgeColor = obsState.isRecordingPaused ? 'bg-amber-500' : 'bg-red-500 animate-pulse';
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    // If in edit mode, tap directly opens editor
    if (isEditMode) {
      onEdit(deckKey);
      return;
    }

    hasTriggeredLongPress.current = false;
    setIsPressed(true);

    // Setup 500ms long press timer to edit
    pressTimer.current = setTimeout(() => {
      hasTriggeredLongPress.current = true;
      triggerHaptic();
      setIsPressed(false);
      onEdit(deckKey);
    }, 550);
  };

  const handlePointerUp = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditMode || hasTriggeredLongPress.current) {
      return;
    }

    if (isEmpty) {
      onEdit(deckKey);
      return;
    }

    // Feedback
    triggerHaptic();
    if (deckKey.actionType === 'obs_copyright_panic') {
      playPanicSound();
    } else if (deckKey.actionType === 'sound_effect' && deckKey.actionTarget === 'airhorn') {
      playAirhornSound();
    } else if (deckKey.actionType === 'sound_effect' && deckKey.actionTarget === 'chime') {
      playChimeSound();
    } else {
      playTactileClick();
    }

    setIsFired(true);
    setTimeout(() => setIsFired(false), 220);

    onExecute(deckKey);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onEdit(deckKey);
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        backgroundColor: isEmpty ? '#18181b' : (deckKey.bgColor || '#1e1e1e'),
        color: isEmpty ? '#71717a' : (deckKey.textColor || '#ffffff'),
        borderColor: isCurrentlyActive ? '#60a5fa' : (isEmpty ? '#27272a' : '#3f3f46'),
      }}
      className={`
        relative select-none flex flex-col items-center justify-center p-2 rounded-xl border
        aspect-square transition-all duration-150 touch-manipulation cursor-pointer overflow-hidden
        ${isPressed ? 'scale-95 brightness-125' : 'scale-100'}
        ${isFired ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black' : ''}
        ${isCurrentlyActive ? 'ring-2 ring-blue-500/70 shadow-lg shadow-blue-500/20' : 'hover:border-zinc-500'}
        ${isEmpty ? 'border-dashed hover:border-zinc-500 hover:bg-zinc-800/40' : 'shadow-md'}
      `}
      title={isEmpty ? 'Mantén presionado para configurar tecla' : `${deckKey.label} (Mantén presionado para editar)`}
    >
      {/* Active Scene / State Glow */}
      {isCurrentlyActive && (
        <span className="absolute inset-0 bg-blue-500/10 pointer-events-none rounded-xl" />
      )}

      {/* Status badge in top right corner */}
      {statusBadge && (
        <span className={`absolute top-1 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase text-white tracking-wider shadow-sm ${badgeColor}`}>
          {statusBadge}
        </span>
      )}

      {/* Edit Mode Badge Indicator */}
      {isEditMode && (
        <span className="absolute top-1 left-1.5 bg-amber-500 text-black px-1 rounded text-[9px] font-bold">
          ✎
        </span>
      )}

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center text-zinc-500 group-hover:text-zinc-300">
          <span className="text-2xl font-light leading-none">+</span>
          <span className="text-[10px] mt-1 font-mono tracking-tight opacity-50">VACÍO</span>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-between w-full h-full pointer-events-none py-0.5">
          {/* Icon Area */}
          <div className="flex-1 flex items-center justify-center py-1">
            <KeyIcon name={deckKey.icon} size={28} className="drop-shadow" />
          </div>

          {/* Labels */}
          <div className="w-full text-center flex flex-col items-center justify-end px-0.5">
            <span className="text-xs font-bold leading-tight line-clamp-1 w-full text-center tracking-tight">
              {deckKey.label}
            </span>
            {deckKey.sublabel && (
              <span className="text-[9px] opacity-70 leading-none truncate max-w-full mt-0.5">
                {deckKey.sublabel}
              </span>
            )}
          </div>
        </div>
      )}
    </button>
  );
};
