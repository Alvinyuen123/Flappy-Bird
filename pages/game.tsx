import { useEffect, useRef, useState } from "react";
import { GameEngine } from "@/lib/game/engine";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Score } from "@shared/schema";
import { NameDialog } from "@/components/ui/name-dialog";
import { Link } from "wouter";

const PLAYER_NAME_KEY = "flappyBirdPlayerName";

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [personalBest, setPersonalBest] = useState(0);
  const { toast } = useToast();

  // Load saved name on mount
  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const { data: highScores, isLoading } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
    initialData: [],
    onSettled: (scores) => {
      if (playerName && scores) {
        const personalScores = scores.filter(s => s.playerName === playerName);
        if (personalScores.length > 0) {
          setPersonalBest(Math.max(...personalScores.map(s => s.score)));
        }
      }
    }
  });

  const submitScore = useMutation({
    mutationFn: async (score: number) => {
      if (!playerName) return;
      await apiRequest("POST", "/api/scores", {
        playerName,
        score,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      toast({
        title: "Score submitted!",
        description: "Your score has been recorded.",
      });
    },
  });

  const handleGameOver = (score: number) => {
    if (score > 0) {
      submitScore.mutate(score);
      if (score > personalBest) {
        setPersonalBest(score);
      }
    }
  };

  const handleNameSubmit = (name: string) => {
    setPlayerName(name);
    localStorage.setItem(PLAYER_NAME_KEY, name);
  };

  useEffect(() => {
    if (!playerName) return; // Don't initialize game until we have a name

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle space key for restart
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && engineRef.current?.isGameOver()) {
        e.preventDefault();
        engineRef.current?.restart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const { width } = container.getBoundingClientRect();
      const height = width * (3/4); // maintain 4:3 aspect ratio

      canvas.width = width;
      canvas.height = height;

      // Reinitialize engine if size changes
      if (engineRef.current) {
        engineRef.current.stop();
      }
      engineRef.current = new GameEngine(canvas, handleGameOver);
      engineRef.current.start();
    };

    // Initial size
    updateCanvasSize();

    // Handle resize
    const resizeObserver = new ResizeObserver(updateCanvasSize);
    resizeObserver.observe(canvas.parentElement!);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      resizeObserver.disconnect();
      engineRef.current?.stop();
    };
  }, [playerName]);

  if (!playerName) {
    return <NameDialog onSubmit={handleNameSubmit} />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Playing as: {playerName}</h2>
              <p className="text-sm text-muted-foreground">Personal Best: {personalBest}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/leaderboard">
                <Button variant="outline">Leaderboard</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem(PLAYER_NAME_KEY);
                  setPlayerName(null);
                }}
              >
                Change Name
              </Button>
            </div>
          </div>

          <Card className="p-4">
            <div className="w-full aspect-[4/3] bg-sky-100 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full"
              />
            </div>
          </Card>
          <p className="text-center text-muted-foreground">
            Press SPACE or click to jump. When game over, press SPACE or click RESTART to play again
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-bold mb-4">High Scores</h2>
            <div className="space-y-2">
              {isLoading ? (
                <p>Loading scores...</p>
              ) : highScores && highScores.length > 0 ? (
                highScores.map((score) => (
                  <div
                    key={score.id}
                    className="flex justify-between items-center"
                  >
                    <span className={score.playerName === playerName ? "font-semibold" : ""}>
                      {score.playerName}
                    </span>
                    <span className="font-mono">{score.score}</span>
                  </div>
                ))
              ) : (
                <p>No scores yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}