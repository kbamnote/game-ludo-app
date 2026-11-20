export const STEP_MS = 280
export const RESCUE_MS = 6500
export const RESCUE_ARRIVAL_MS = 550
export const RESCUE_HOME_MS = 6430
export const LOCAL_DICE_ROLL_MS = 900
export const ONLINE_DICE_ROLL_MS = 650

export function presentationMs(steps: number, captures: number) {
  return steps * STEP_MS + captures * RESCUE_MS
}
