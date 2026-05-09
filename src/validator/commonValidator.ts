import zod from "zod";
import { Piece } from "../types/common";

export const GameStateSchema = zod.object({
  blackKingsLocation: zod.string(),
  whiteKingsLocation: zod.string(),
  castling: zod
    .array(
      zod.object({
        isCastlingPossible: zod.boolean(),
        isCastlingPossibleNow: zod.boolean(),
        for: zod.enum(["K", "Q", "k", "q"]),
      }),
    )
    .length(4),
  enPassant: zod.string(),
  fullMoves: zod.number(),
  halfMoves: zod.number(),
  turnToPlay: zod.enum(["WHITE", "BLACK"]),
  board: zod
    .array(zod.array(zod.union([zod.enum(Piece), zod.null()])))
    .length(8),
});
