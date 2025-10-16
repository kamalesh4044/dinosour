import { useState, useEffect } from 'react';
import { supabase, GameScore } from '../lib/supabase';

export function useGameScores() {
  const [topScores, setTopScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopScores();
  }, []);

  const fetchTopScores = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);

    if (!error && data) {
      setTopScores(data);
    }
    setLoading(false);
  };

  const saveScore = async (playerName: string, score: number, level: number) => {
    const { error } = await supabase
      .from('game_scores')
      .insert([{ player_name: playerName, score, level }]);

    if (!error) {
      await fetchTopScores();
    }
    return !error;
  };

  return { topScores, loading, saveScore, refreshScores: fetchTopScores };
}
