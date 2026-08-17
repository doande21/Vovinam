import { Match, CombatVote, CombatScoreEvent } from '../types';

export const CONSENSUS_WINDOW_MS = 1800; // 1.8 seconds window for 2/3 judges consensus

/**
 * Checks if a new vote from a judge triggers a 2/3 consensus with existing active votes.
 * Returns the updated match state with added points and clean vote history.
 */
export function processCombatVote(
  currentMatch: Match,
  newVote: CombatVote
): { updatedMatch: Match; consensusTriggered: boolean; triggeredEvent?: CombatScoreEvent } {
  const now = Date.now();
  const existingVotes = (currentMatch.activeVotes || []).filter(
    v => now - v.timestamp <= CONSENSUS_WINDOW_MS && v.judgeId !== newVote.judgeId
  );

  // Find matching votes with the same corner and points within window
  const matchingVotes = existingVotes.filter(
    v => v.corner === newVote.corner && v.points === newVote.points
  );

  // If there's at least 1 other judge who voted for the same corner & points -> Consensus reached! (2/3 judges)
  if (matchingVotes.length >= 1) {
    const participatingJudges = Array.from(
      new Set([...matchingVotes.map(v => v.judgeName || v.judgeId), newVote.judgeName || newVote.judgeId])
    );

    const cornerName = newVote.corner === 'red' ? 'ĐỎ' : 'XANH';
    const pointLabel = newVote.points === 1 ? 'Đòn đấm/đá (+1)' : 'Đòn chân/quật ngã (+2)';
    
    const event: CombatScoreEvent = {
      id: `${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      corner: newVote.corner,
      points: newVote.points,
      judges: participatingJudges,
      description: `Đồng thuận 2/3 (${participatingJudges.join(' & ')}): +${newVote.points} điểm ${cornerName} (${pointLabel})`
    };

    const newRedScore = newVote.corner === 'red' ? (currentMatch.redScore || 0) + newVote.points : (currentMatch.redScore || 0);
    const newBlueScore = newVote.corner === 'blue' ? (currentMatch.blueScore || 0) + newVote.points : (currentMatch.blueScore || 0);

    // Filter out used votes for this specific hit
    const remainingVotes = existingVotes.filter(
      v => !(v.corner === newVote.corner && v.points === newVote.points)
    );

    const updatedMatch: Match = {
      ...currentMatch,
      redScore: newRedScore,
      blueScore: newBlueScore,
      activeVotes: remainingVotes,
      scoreLog: [event, ...(currentMatch.scoreLog || [])].slice(0, 50) // keep last 50 events
    };

    return { updatedMatch, consensusTriggered: true, triggeredEvent: event };
  }

  // No consensus yet, append new vote to active votes
  const updatedVotes = [...existingVotes, newVote];
  const updatedMatch: Match = {
    ...currentMatch,
    activeVotes: updatedVotes
  };

  return { updatedMatch, consensusTriggered: false };
}
