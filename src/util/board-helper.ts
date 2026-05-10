import type { Board, Piece } from "../types/common";

// const columns = ["h", "g", "f", "e", "d", "c", "b", "a"];

export function isWhitePiece(p: Piece) {
  return p !== null && p === p.toUpperCase();
}

export function isBlackPiece(p: Piece) {
  return p !== null && p === p.toLowerCase();
}

export const pieceImages: Record<string, string> = {
  P: "https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg",
  R: "https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg",
  N: "https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg",
  B: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg",
  Q: "https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg",
  K: "https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg",

  p: "https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg",
  r: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg",
  n: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg",
  b: "https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg",
  q: "https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg",
  k: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg",
};

export function fenToBoard(fen: string): Board {
  const placement = fen.split(" ")[0];
  const rows = placement.split("/");

  const board: Board = [];

  rows.forEach((row) => {
    const boardRow: (Piece | null)[] = [];

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
