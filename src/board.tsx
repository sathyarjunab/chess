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
  gameResult: "WHITE" | "BLACK" | null;
  resetGame: () => void;
};

const BoardComponent: React.FC<BoardComponentProps> = ({
  gameState,
  setGameState,
  setLocation,
  legalMoves,
  setLegalMoves,
  gameResult,
  resetGame,
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

    if (
      isCastlingMove &&
      (previousSelection === "K" || previousSelection === "k")
    ) {
      disableRights(previousSelection === "K" ? ["K", "Q"] : ["k", "q"]);
      return;
    }

    if (previousSelection === "K") {
      disableRights(["K", "Q"]);
      return;
    }
    if (previousSelection === "k") {
      disableRights(["k", "q"]);
      return;
    }

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
    if (
      (previousSelection === "P" || previousSelection === "p") &&
      Math.abs(fromRow - toRow) === 2 &&
      Math.abs(fromCol - toCol) === 0
    ) {
      toRow = previousSelection === "P" ? toRow : toRow + 2; 
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
    <div className="h-screen w-screen flex flex-col justify-center items-center bg-[#1e1e1e] font-sans py-2 sm:py-4">
      {/* Game Header */}
      <div className="mb-2 sm:mb-6 flex items-center justify-between w-full max-w-[320px] sm:max-w-[448px] md:max-w-[512px] px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-lg sm:text-2xl font-light tracking-widest text-white uppercase">
            Chess <span className="text-amber-500 font-bold">Pro</span>
          </div>
        </div>
        <button
          onClick={resetGame}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-300 transition-colors bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white"
        >
          Reset
        </button>
      </div>

      {pendingPromotion && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-all duration-300 px-4">
          <div className="relative rounded-2xl border border-white/10 bg-gray-900/90 p-4 sm:p-8 shadow-2xl backdrop-blur-xl w-full max-w-sm">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider">
              Promotion
            </div>
            <div className="mb-4 sm:mb-6 text-center text-base sm:text-lg font-light text-gray-200">
              Select piece
            </div>
            <div className="flex justify-center gap-2 sm:gap-4">
              {promotionOptions(pendingPromotion.pawn).map((promoteTo) => (
                <button
                  key={promoteTo}
                  className="group flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl border border-white/5 bg-white/5 transition-all duration-200 hover:scale-105 sm:hover:scale-110 hover:bg-amber-600/20 hover:border-amber-600/50"
                  onClick={() => {
                    const promotedBoard = structuredClone(pendingPromotion.board);
                    promotedBoard[pendingPromotion.toRow][pendingPromotion.toCol] = promoteTo;
                    setPendingPromotion(null);
                    setCoordinates(null);
                    setLocation(null);
                    setLegalMoves([]);
                    setGameState((prev) => ({
                      ...prev,
                      turnToPlay: prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
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
                    className="h-10 w-10 sm:h-16 sm:w-16 transition-transform group-hover:rotate-6"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {gameResult && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all animate-in fade-in duration-500 px-4">
          <div className="text-center p-6 sm:p-12 rounded-3xl bg-gradient-to-b from-gray-800 to-gray-900 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-sm">
            <div className="mb-1 sm:mb-2 text-amber-500 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-sm">
              Checkmate
            </div>
            <h2 className="mb-6 sm:mb-8 text-3xl sm:text-6xl font-black text-white uppercase tracking-tighter">
              {gameResult} <span className="font-light italic text-amber-500">WON</span>
            </h2>
            <button
              onClick={resetGame}
              className="px-6 py-3 sm:px-10 sm:py-4 text-base sm:text-xl font-bold text-gray-900 transition-all bg-amber-500 rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/20"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Chess Board */}
      <div className="relative rounded-xl overflow-hidden border-[8px] border-[#2c2c2c] shadow-[0_15px_40px_rgba(0,0,0,0.4)] transition-all duration-500">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const squareId = `${8 - rowIndex}${columns[colIndex]}`;
              const isSelected = coOrdinates?.row === rowIndex && coOrdinates?.col === colIndex;
              const isLegalMove = legalMoves.includes(`${columns[colIndex]}${rowIndex + 1}`);

              return (
                <div
                  key={colIndex}
                  id={squareId}
                  className={`relative w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-colors duration-200
                  ${isLight ? "bg-[#eae9d2]" : "bg-[#4b7399]"}
                  ${isSelected ? "ring-2 sm:ring-4 ring-inset ring-amber-400/80" : ""}
                  `}
                  onClick={() => handleClick(rowIndex, colIndex)}
                >
                  {/* Square Label (Coordinate) */}
                  {colIndex === 0 && (
                    <span className={`absolute top-0.5 left-0.5 sm:left-1 text-[7px] sm:text-[9px] font-bold ${isLight ? "text-[#4b7399]" : "text-[#eae9d2]"}`}>
                      {8 - rowIndex}
                    </span>
                  )}
                  {rowIndex === 7 && (
                    <span className={`absolute bottom-0.5 right-0.5 sm:right-1 text-[7px] sm:text-[9px] font-bold ${isLight ? "text-[#4b7399]" : "text-[#eae9d2]"}`}>
                      {columns[colIndex]}
                    </span>
                  )}

                  {piece && (
                    <img 
                      src={`${pieceImages[piece]}`} 
                      className={`w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 transition-transform duration-300 z-10 ${isSelected ? "scale-110 -translate-y-0.5 sm:-translate-y-1 drop-shadow-2xl" : "drop-shadow-lg"}`} 
                    />
                  )}

                  {/* Legal Move Indicator */}
                  {isLegalMove && (
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      {piece ? (
                        <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-14 md:h-14 border-2 sm:border-4 border-black/10 rounded-full"></div>
                      ) : (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-black/10 rounded-full shadow-inner"></div>
                      )}
                    </div>
                  )}

                  {/* Capture Highlight */}
                  {isLegalMove && piece && (
                    <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Turn Indicator */}
      <div className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 border border-white/10 flex items-center gap-3 sm:gap-4">
        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${gameState.turnToPlay === "WHITE" ? "bg-white shadow-[0_0_10px_white]" : "bg-gray-600"}`}></div>
        <span className="text-[10px] sm:text-sm font-medium text-gray-400 uppercase tracking-widest">
          {gameState.turnToPlay === "WHITE" ? "White's Turn" : "Black's Turn"}
        </span>
        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${gameState.turnToPlay === "BLACK" ? "bg-white shadow-[0_0_10px_white]" : "bg-gray-600"}`}></div>
      </div>
    </div>
  );
};

export default BoardComponent;
