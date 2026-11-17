export const RECOVERY_WAIT_MS = 30 * 60 * 1000;
export function recoveryTooSoon(state, backup, now=Date.now()){
  if(state!=="in_progress" && state!=="restoring")return false;
  const timestamp=state==="in_progress" ? backup.startedAt : backup.restoringAt;
  const began=Date.parse(timestamp||"");
  return !Number.isFinite(began) || now-began<RECOVERY_WAIT_MS;
}
