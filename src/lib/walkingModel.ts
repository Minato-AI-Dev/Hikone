import type { Answers } from '../types';
// Planning assumptions, not measured individual speed or calibrated confidence bounds.
export const WALKING_MODEL = {
  pace:{standard:1,relaxed:1.2,slow:1.45},conditions:{normal:1,rain:1.15,heat:1.25},safetyMinutes:5,
} as const;
export function adjustedMinutes(seconds:number,answers:Answers):number {
  const pace=WALKING_MODEL.pace[answers.walkingPace||'standard'];
  const conditions=WALKING_MODEL.conditions[answers.walkingConditions||'normal'];
  if(!Number.isFinite(seconds)||seconds<0||!pace||!conditions)throw new Error('Invalid walking estimate');
  return Math.ceil(seconds/60*pace*conditions);
}
