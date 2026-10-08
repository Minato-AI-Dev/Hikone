import { placeEdges } from '../data/placeEdges';

export type RouteMetrics = { minutes: number; walkingMeters: number };
type Node = { id: string; minutes: number; walkingMeters: number };

export function routeMetrics(fromPlaceId: string, toPlaceId: string): RouteMetrics | null {
  if (fromPlaceId === toPlaceId) return { minutes: 0, walkingMeters: 0 };

  const adjacency = new Map<string, Node[]>();
  const add = (from:string, to:string, minutes:number, walkingMeters:number) => {
    const list = adjacency.get(from) || [];
    list.push({ id:to, minutes, walkingMeters });
    adjacency.set(from, list);
  };

  for (const edge of placeEdges) {
    add(edge.fromPlaceId, edge.toPlaceId, edge.minutes, edge.walkingMeters);
    if (edge.bidirectional) add(edge.toPlaceId, edge.fromPlaceId, edge.minutes, edge.walkingMeters);
  }

  const best = new Map<string, RouteMetrics>();
  const queue: Array<{ id:string; minutes:number; walkingMeters:number }> = [{ id:fromPlaceId, minutes:0, walkingMeters:0 }];
  best.set(fromPlaceId, { minutes:0, walkingMeters:0 });

  while (queue.length) {
    queue.sort((a,b)=>a.minutes-b.minutes);
    const current = queue.shift()!;
    if (current.id === toPlaceId) return { minutes:current.minutes, walkingMeters:current.walkingMeters };
    const known = best.get(current.id);
    if (known && current.minutes > known.minutes) continue;

    for (const next of adjacency.get(current.id) || []) {
      const candidate = { minutes:current.minutes+next.minutes, walkingMeters:current.walkingMeters+next.walkingMeters };
      const previous = best.get(next.id);
      if (!previous || candidate.minutes < previous.minutes) {
        best.set(next.id, candidate);
        queue.push({ id:next.id, ...candidate });
      }
    }
  }
  return null;
}
