/*
  # Game Scores and Leaderboard Schema

  1. New Tables
    - `game_scores`
      - `id` (uuid, primary key) - Unique identifier for each score entry
      - `player_name` (text) - Name of the player
      - `score` (integer) - Final score achieved
      - `level` (integer) - Final level reached
      - `created_at` (timestamptz) - When the score was recorded
  
  2. Indexes
    - Index on `score` for efficient leaderboard queries (descending order)
    - Index on `created_at` for recent scores
  
  3. Security
    - Enable RLS on `game_scores` table
    - Allow anyone to insert scores (public game)
    - Allow anyone to read scores for leaderboard display
*/

CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL DEFAULT 'Anonymous',
  score integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at DESC);

-- Enable RLS
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert scores (public game)
CREATE POLICY "Anyone can insert scores"
  ON game_scores
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read scores for leaderboard
CREATE POLICY "Anyone can read scores"
  ON game_scores
  FOR SELECT
  USING (true);