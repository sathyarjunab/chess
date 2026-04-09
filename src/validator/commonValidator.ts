import zod from "zod";
import { Piece } from "../types/common";

export const GameStateSchema = zod.object({
  blackKingsLocation: zod.string(),
  castling: zod.string(),
  enPassant: zod.string(),
  fullMoves: zod.number(),
  halfMoves: zod.number(),
  turnToPlay: zod.enum(["WHITE", "BLACK"]),
  whiteKingsLocation: zod.string(),
  board: zod
    .array(zod.array(zod.union([zod.enum(Piece), zod.null()])))
    .length(8),
});
