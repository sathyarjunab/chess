import React from "react";
import type z from "zod";
import { isBlackPiece, isWhitePiece, pieceImages } from "./util/board-helper";
import type { GameStateSchema } from "./validator/commonValidator";
import { Piece } from "./types/common";

const columns = ["h", "g", "f", "e", "d", "c", "b", "a"];

type BoardComponentProps = {
  gameState: z.infer<typeof GameStateSchema>;
  setGameState: React.Dispatch<
    React.SetStateAction<z.infer<typeof GameStateSchema>>
  >;
  setLocation: React.Dispatch<
    React.SetStateAction<`${string}${number}` | null>
  >;
  legalMoves: string[];
  setLegalMoves: React.Dispatch<React.SetStateAction<string[]>>;
};

const BoardComponent: React.FC<BoardComponentProps> = ({
  gameState,
  setGameState,
  setLocation,
  legalMoves,
  setLegalMoves,
}) => {
  const [coOrdinates, setCoordinates] = React.useState<{
    row: number;
    col: number;
  } | null>(null);

  const [pendingPromotion, setPendingPromotion] = React.useState<{
    board: (Piece | null)[][];
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    pawn: Piece.WhitePawn | Piece.BlackPawn;
    isCastlingMove: boolean;
    isEnPassantMove: boolean;
  } | null>(null);

  function isPromotionMove(
    pawn: Piece.WhitePawn | Piece.BlackPawn,
    toRow: number,
  ) {
    return (
      (pawn === Piece.WhitePawn && toRow === 7) ||
      (pawn === Piece.BlackPawn && toRow === 0)
    );
  }

  function promotionOptions(pawn: Piece.WhitePawn | Piece.BlackPawn) {
    return pawn === Piece.WhitePawn
      ? ([
          Piece.WhiteQueen,
          Piece.WhiteRook,
          Piece.WhiteBishop,
          Piece.WhiteKnight,
        ] as const)
      : ([
          Piece.BlackQueen,
          Piece.BlackRook,
          Piece.BlackBishop,
          Piece.BlackKnight,
        ] as const);
  }

  function handleClick(rowIndex: number, colIndex: number) {
    if (pendingPromotion) return;
    const { row: x = -1, col: y = -1 } = coOrdinates || {};
    const currentSelection = gameState.board[rowIndex][
      colIndex
    ] as Piece | null;

    if (legalMoves.includes(`${columns[colIndex]}${rowIndex + 1}`)) {
      const previousSelection = gameState.board[x][y];
      const updatedBoard = structuredClone(gameState.board);

      updatedBoard[rowIndex][colIndex] = previousSelection;
      updatedBoard[x][y] = null;
      setLegalMoves([]);

      const isCastlingMove =
        (previousSelection === "K" &&
          x === 0 &&
          y === 4 &&
          rowIndex === 0 &&
          (colIndex === 2 || colIndex === 6)) ||
        (previousSelection === "k" &&
          x === 7 &&
          y === 4 &&
          rowIndex === 7 &&
          (colIndex === 2 || colIndex === 6));

      let isEnPassantMove = false;

      if (previousSelection) {
        isEnPassantMove = isEnPassant(previousSelection, y, rowIndex, colIndex);
      }
      if (!isCastlingMove) {
        if (isEnPassantMove) {
          const enPassantBoard = structuredClone(gameState.board);
          enPassantBoard[rowIndex][colIndex] = previousSelection;
          enPassantBoard[x][y] = null;
          if (previousSelection === "P") {
            enPassantBoard[rowIndex - 1][colIndex] = null;
          } else {
            enPassantBoard[rowIndex + 1][colIndex] = null;
          }
          if (
            previousSelection &&
            (previousSelection === Piece.WhitePawn ||
              previousSelection === Piece.BlackPawn) &&
            isPromotionMove(previousSelection, rowIndex)
          ) {
            setPendingPromotion({
              board: enPassantBoard,
              fromRow: x,
              fromCol: y,
              toRow: rowIndex,
              toCol: colIndex,
              pawn: previousSelection,
              isCastlingMove,
              isEnPassantMove,
            });
            return;
          }

          setGameState((prev) => ({
            ...prev,
            turnToPlay: prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
            board: enPassantBoard,
          }));
        } else {
          if (
            previousSelection &&
            (previousSelection === Piece.WhitePawn ||
              previousSelection === Piece.BlackPawn) &&
            isPromotionMove(previousSelection, rowIndex)
          ) {
            setPendingPromotion({
              board: updatedBoard,
              fromRow: x,
              fromCol: y,
              toRow: rowIndex,
              toCol: colIndex,
              pawn: previousSelection,
              isCastlingMove,
              isEnPassantMove,
            });
            return;
          }
          setGameState((prev) => ({
            ...prev,
            turnToPlay: prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
            board: updatedBoard,
          }));
        }
      } else {
        const castledBoard = structuredClone(gameState.board);
        castledBoard[rowIndex][colIndex] = previousSelection;
        castledBoard[x][y] = null;

        if (gameState.turnToPlay === "WHITE") {
          if (y > colIndex) {
            // left castling
            castledBoard[0][0] = null;
            castledBoard[0][3] = Piece.WhiteRook;
          } else {
            // right castling
            castledBoard[0][7] = null;
            castledBoard[0][5] = Piece.WhiteRook;
          }
        } else {
          if (y > colIndex) {
            // left castling
            castledBoard[7][0] = null;
            castledBoard[7][3] = Piece.BlackRook;
          } else {
            // right castling
            castledBoard[7][7] = null;
            castledBoard[7][5] = Piece.BlackRook;
          }
        }

        setGameState((prev) => ({
          ...prev,
          turnToPlay: prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
          board: castledBoard,
        }));
      }

      setGameState((prev) => ({
        ...prev,
        ...(previousSelection === "K"
          ? {
              whiteKingsLocation: `${columns[colIndex]}${rowIndex + 1}`,
            }
          : {}),
        ...(previousSelection === "k"
          ? {
              blackKingsLocation: `${columns[colIndex]}${rowIndex + 1}`,
            }
          : {}),
        enPassant: "-",
      }));

      if (previousSelection) {
        handleCastlingMutation(previousSelection, isCastlingMove, x, y);
        handleEnPassantMutation(previousSelection, x, y, rowIndex, colIndex);
      }
    }

    if (!currentSelection) {
      setCoordinates(null);
      setLegalMoves([]);
      return;
    }

    // check the turn
    if (gameState.turnToPlay === "WHITE" && !isWhitePiece(currentSelection))
      return;
    if (gameState.turnToPlay === "BLACK" && !isBlackPiece(currentSelection))
      return;

    setCoordinates({ row: rowIndex, col: colIndex });
    setLocation(`${columns[colIndex]}${rowIndex + 1}`);
  }

  function handleCastlingMutation(
    previousSelection: Piece,
    isCastlingMove: boolean,
    fromRow: number,
    fromCol: number,
  ) {
    const disableRights = (rights: Array<"K" | "Q" | "k" | "q">) => {
      setGameState((prev) => ({
        ...prev,
        castling: prev.castling.map((c) =>
          rights.includes(c.for) && c.isCastlingPossible
            ? { ...c, isCastlingPossible: false, isCastlingPossibleNow: false }
            : c,
        ),
      }));
    };

    // If the move is a castling move, the king has moved -> both rights for that
    // color are consumed.
    if (
      isCastlingMove &&
      (previousSelection === "K" || previousSelection === "k")
    ) {
      disableRights(previousSelection === "K" ? ["K", "Q"] : ["k", "q"]);
      return;
    }

    // This means the user as moved the piece and if the piece moved is king or rook then we need to update the castling availability
    if (previousSelection === "K") {
      disableRights(["K", "Q"]);
      return;
    }
    if (previousSelection === "k") {
      disableRights(["k", "q"]);
      return;
    }

    // Rook moves only consume the side corresponding to the rook that moved.
    // Note: this uses the board indexing assumptions already used elsewhere in
    // this file (white home row = 0, black home row = 7).
    if (previousSelection === "R") {
      if (fromRow === 0 && fromCol === 0) disableRights(["Q"]);
      if (fromRow === 0 && fromCol === 7) disableRights(["K"]);
      return;
    }
    if (previousSelection === "r") {
      if (fromRow === 7 && fromCol === 0) disableRights(["q"]);
      if (fromRow === 7 && fromCol === 7) disableRights(["k"]);
    }
  }

  function handleEnPassantMutation(
    previousSelection: Piece,
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
  ) {
    // If a pawn moves two squares forward from its starting position, it can be captured en passant on the opponent's next turn. This means we need to set the en passant target square in the game state when this happens, and also clear it if any other move is made.
    if (
      (previousSelection === "P" || previousSelection === "p") &&
      Math.abs(fromRow - toRow) === 2 &&
      Math.abs(fromCol - toCol) === 0
    ) {
      toRow = previousSelection === "P" ? toRow : toRow + 2; // The en passant target square is the square that the pawn "jumped over"
      setGameState((prev) => ({
        ...prev,
        enPassant: `${columns[fromCol]}${toRow}`,
      }));
    }
  }

  function isEnPassant(
    previousSelection: Piece,
    fromCol: number,
    toRow: number,
    toCol: number,
  ) {
    // Check if the move is an en passant capture
    if (
      (previousSelection === "P" || previousSelection === "p") &&
      fromCol !== toCol &&
      gameState.enPassant === `${columns[toCol]}${toRow + 1}`
    ) {
      return true;
    }
    return false;
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-900 bg-[url('/background.jpg')] bg-cover bg-center">
      {pendingPromotion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="rounded-xl border border-gray-600 bg-gray-900 p-4">
            <div className="mb-3 text-center text-sm text-gray-200">
              Choose promotion
            </div>
            <div className="flex gap-3">
              {promotionOptions(pendingPromotion.pawn).map((promoteTo) => (
                <button
                  key={promoteTo}
                  className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-600 bg-gray-800 hover:bg-gray-700"
                  onClick={() => {
                    const promotedBoard = structuredClone(
                      pendingPromotion.board,
                    );
                    promotedBoard[pendingPromotion.toRow][
                      pendingPromotion.toCol
                    ] = promoteTo;

                    setPendingPromotion(null);
                    setCoordinates(null);
                    setLocation(null);
                    setLegalMoves([]);

                    setGameState((prev) => ({
                      ...prev,
                      turnToPlay:
                        prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
                      board: promotedBoard,
                      enPassant: "-",
                    }));

                    handleCastlingMutation(
                      pendingPromotion.pawn,
                      pendingPromotion.isCastlingMove,
                      pendingPromotion.fromRow,
                      pendingPromotion.fromCol,
                    );
                    handleEnPassantMutation(
                      pendingPromotion.pawn,
                      pendingPromotion.fromRow,
                      pendingPromotion.fromCol,
                      pendingPromotion.toRow,
                      pendingPromotion.toCol,
                    );
                  }}
                >
                  <img
                    src={`${pieceImages[promoteTo]}`}
                    className="h-12 w-12"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl overflow-hidden border-4 border-gray-700">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;

              return (
                <div
                  key={colIndex}
                  id={`${8 - rowIndex}${columns[colIndex]}`}
                  className={`w-16 h-16 flex items-center justify-center
                  ${isLight ? "bg-[#FAF9F6]" : "bg-[#36454F]"}`}
                  onClick={() => handleClick(rowIndex, colIndex)}
                >
                  {piece && (
                    <img src={`${pieceImages[piece]}`} className="w-14 h-14" />
                  )}
                  {legalMoves.includes(
                    `${columns[colIndex]}${rowIndex + 1}`,
                  ) && (
                    <div className="absolute w-14 h-14 bg-red-500 opacity-50"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardComponent;
