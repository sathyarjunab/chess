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

  function handleClick(rowIndex: number, colIndex: number) {
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

      if (!isCastlingMove) {
        setGameState((prev) => ({
          ...prev,
          turnToPlay: prev.turnToPlay === "WHITE" ? "BLACK" : "WHITE",
          board: updatedBoard,
        }));
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
      }));

      if (previousSelection)
        handleCastlingMutation(previousSelection, isCastlingMove, x, y);
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

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-900 bg-[url('/background.jpg')] bg-cover bg-center">
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
