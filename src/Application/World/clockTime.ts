/** Clockwise angles from twelve, sampled from local wall time on every frame. */
export function clockHandAngles(now: Date): [number, number, number] {
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;
  const turn = -Math.PI * 2;
  return [(hours / 12) * turn, (minutes / 60) * turn, (seconds / 60) * turn];
}
