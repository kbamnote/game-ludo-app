export const STEP_MS = 280
export const RESCUE_MS = 6500

export function presentationMs(steps: number, captures: number) {
  return steps * STEP_MS + captures * RESCUE_MS
}
