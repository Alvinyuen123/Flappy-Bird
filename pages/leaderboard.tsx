import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Score } from "@shared/schema";

const PLAYER_NAME_KEY = "flappyBirdPlayerName";

export default function Leaderboard() {
  const [playerName, setPlayerName] = useState<string | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem(PLAYER_NAME_KEY);
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
    initialData: []
  });

  const personalScores = scores.filter(score => score.playerName === playerName);
  const personalBest = personalScores.length > 0 
    ? Math.max(...personalScores.map(s => s.score))
    : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <Link href="/">
            <Button>Back to Game</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Global Top Scores</h2>
            <div className="space-y-2">
              {isLoading ? (
                <p>Loading scores...</p>
              ) : scores.length > 0 ? (
                scores.map((score, index) => (
                  <div
                    key={score.id}
                    className="flex justify-between items-center p-2 bg-muted/50 rounded"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-mono w-8">{index + 1}</span>
                      <span className={score.playerName === playerName ? "font-semibold" : ""}>
                        {score.playerName}
                      </span>
                    </div>
                    <span className="font-mono text-lg">{score.score}</span>
                  </div>
                ))
              ) : (
                <p>No scores yet</p>
              )}
            </div>
          </Card>

          {playerName && (
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Your Scores</h2>
              <div className="space-y-4">
                <div className="p-4 bg-primary/10 rounded">
                  <div className="text-sm text-muted-foreground">Personal Best</div>
                  <div className="text-3xl font-bold">{personalBest}</div>
                </div>
                <div className="space-y-2">
                  {personalScores.length > 0 ? (
                    personalScores
                      .sort((a, b) => b.score - a.score)
                      .map((score) => (
                        <div
                          key={score.id}
                          className="flex justify-between items-center p-2 bg-muted/50 rounded"
                        >
                          <span className="font-mono">{score.score}</span>
                        </div>
                      ))
                  ) : (
                    <p>You haven't played any games yet</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
