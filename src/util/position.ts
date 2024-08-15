import { Vector2, Vector3 } from "@dcl/protocol/out-ts/decentraland/common/vectors.gen"

export function worldToGrid(vector: Vector3, target: Vector2 = { x: 0, y: 0 }): Vector2 {
  target.x = (vector.x / 16)
  target.y = (vector.z / 16)
  return target
}
