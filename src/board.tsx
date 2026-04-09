import React from "react";
import type z from "zod";
import { isBlackPiece, isWhitePiece, pieceImages } from "./util/bord-helper";
import type { GameStateSchema } from "./validator/commonValidator";
import { Piece } from "./types/common";

const columns = ["h", "g", "f", "e", "d", "c", "b", "a"];

const BoardComponent: React.FC<{
  gameState: z.infer<typeof GameStateSchema>;
  setGameState: React.Dispatch<
    React.SetStateAction<z.infer<typeof GameStateSchema>>
  >;
  setLocation: React.Dispatch<React.SetStateAction<string | undefined>>;
  youMightMove: string[];
}> = ({ gameState, setGameState, setLocation, youMightMove }) => {
  function handleClick(
    rowIndex: number,
    colIndex: number,
    piece: Piece | null,
  ) {
    if (!piece) return;

    // checks the turn
    if (gameState.turnToPlay === "WHITE" && !isWhitePiece(piece)) return;
    if (gameState.turnToPlay === "BLACK" && !isBlackPiece(piece)) return;

    const square = `${columns[colIndex]}${8 - rowIndex + 1}`; // Convert to algebraic notation
    setLocation(square);
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
                  onClick={() => handleClick(8 - rowIndex, colIndex, piece)}
                >
                  {piece && (
                    <img src={`${pieceImages[piece]}`} className="w-14 h-14" />
                  )}
                  {youMightMove.includes(
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
