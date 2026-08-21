/**
 * Track monthly AI message usage server-side on the User entity.
 * Count persists across refreshes, app reinstalls, and device switches.
 * Resets only at the start of a new calendar month.
 *
 * Plan limits:
 *   free:        100 / month
 *   progress:    300 / month
 *   performance: 800 / month
 *   elite:      2000 / month
 *
 * Plan AI models (quality + speed scale with plan):
 *   free:        automatic (default)
 *   progress:    gpt_5_mini (faster, more capable)
 *   performance: gemini_3_1_pro (advanced, high quality)
 *   elite:       claude_sonnet_4_6 (highest quality, fast)
 */

import { base44 } from '@/api/base44Client';

const PLAN_LIMITS = {
  free: 100,
  progress: 300,
  performance: 800,
  elite: 2000,
};

const PLAN_MODELS = {
  free: null,
  progress: 'gpt_5_mini',
  performance: 'gemini_3_1_pro',
  elite: 'claude_sonnet_4_6',
};

export function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getPlanLimit(plan = 'free') {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

export function getPlanModel(plan = 'free') {
  return PLAN_MODELS[plan] || null;
}

/**
 * Compute current usage stats from the user object (synchronous).
 * The count is stored server-side on the User entity as kael_msg_count / kael_msg_month.
 */
export function computeStats(user, plan = 'free') {
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const monthKey = getCurrentMonthKey();
  const count = user?.kael_msg_month === monthKey ? (user?.kael_msg_count || 0) : 0;
  return {
    used: count,
    limit,
    remaining: Math.max(0, limit - count),
    monthKey,
  };
}

/**
 * Increment the message count server-side via updateMe.
 * Returns the updated stats object.
 */
export async function incrementMessageCount(plan = 'free') {
  const monthKey = getCurrentMonthKey();
  const user = await base44.auth.me();
  let count;
  if (user?.kael_msg_month === monthKey) {
    count = (user?.kael_msg_count || 0) + 1;
  } else {
    count = 1;
  }
  await base44.auth.updateMe({ kael_msg_count: count, kael_msg_month: monthKey });
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  return {
    used: count,
    limit,
    remaining: Math.max(0, limit - count),
    monthKey,
  };
}

export function canSendMessage(stats) {
  return stats && stats.remaining > 0;
}