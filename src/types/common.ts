export enum Color {
  WHITE = "WHITE",
  BLACK = "BLACK",
}

export enum Piece {
  WhitePawn = "P",
  WhiteRook = "R",
  WhiteKnight = "N",
  WhiteBishop = "B",
  WhiteQueen = "Q",
  WhiteKing = "K",
  BlackPawn = "p",
  BlackRook = "r",
  BlackKnight = "n",
  BlackBishop = "b",
  BlackQueen = "q",
  BlackKing = "k",
}

export type PieceOrEmpty = Piece | null;

export type Board = (Piece | null)[][];
