import { useEffect, useRef } from 'react';
import { Game } from './game/engine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (gameRef.current) return; // Prevent double init

    const game = new Game(canvasRef.current);
    gameRef.current = game;
    game.init();

    // Handle first interaction for audio
    const handleFirstInteraction = () => {
      game.audio.init();
      game.audio.resume();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        imageRendering: 'pixelated',
        cursor: 'default',
      }}
      tabIndex={0}
    />
  );
}
