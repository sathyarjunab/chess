import type { Board, Piece } from "../types/common";

// const columns = ["h", "g", "f", "e", "d", "c", "b", "a"];

export const pieceImages: Record<string, string> = {
  P: "pawn-w.svg",
  R: "rook-w.svg",
  N: "knight-w.svg",
  B: "bishop-w.svg",
  Q: "queen-w.svg",
  K: "king-w.svg",

  p: "pawn-b.svg",
  r: "rook-b.svg",
  n: "knight-b.svg",
  b: "bishop-b.svg",
  q: "queen-b.svg",
  k: "king-b.svg",
};

export function fenToBoard(fen: string): Board {
  const placement = fen.split(" ")[0];
  const rows = placement.split("/");

  const board: Board = [];

  rows.forEach((row) => {
    const boardRow: Piece[] = [];

    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        const empty = Number(ch);
        for (let i = 0; i < empty; i++) {
          boardRow.push(null);
        }
      } else {
        boardRow.push(ch as Piece);
      }
    }

    board.push(boardRow);
  });

  return board;
}

export function boardToFen(board: Board): string {
  const rows: string[] = [];

  board.forEach((row) => {
    let fenRow = "";
    let emptyCount = 0;

    row.forEach((square) => {
      if (!square) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          fenRow += emptyCount;
          emptyCount = 0;
        }
        fenRow += square;
      }
    });

    if (emptyCount > 0) {
      fenRow += emptyCount;
    }

    rows.push(fenRow);
  });

  return rows.join("/");
}
