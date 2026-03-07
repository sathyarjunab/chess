import React, { useState } from "react";
import { fenToBoard, pieceImages } from "./util/bord-helper";

const columns = ["a", "b", "c", "d", "e", "f", "g", "h"];

const BoardComponent: React.FC<{
  fen: string;
  setPieceLocation: React.Dispatch<React.SetStateAction<string | undefined>>;
}> = ({ fen, setPieceLocation }) => {
  const [board] = useState(() => fenToBoard(fen));

  function log(rowIndex: number, colIndex: number) {
    setPieceLocation(`${columns[colIndex]}${8 - rowIndex}`);
  }

  return (
    <div className="h-screen w-screen flex justify-center items-center bg-gray-900 bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="rounded-xl overflow-hidden border-4 border-gray-700">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((piece, colIndex) => {
              const isLight = (rowIndex + colIndex) % 2 === 0;

              return (
                <div
                  key={colIndex}
                  id={`${8 - rowIndex}${columns[colIndex]}`}
                  className={`w-16 h-16 flex items-center justify-center
                  ${isLight ? "bg-[#FAF9F6]" : "bg-[#36454F]"}`}
                  onClick={() => log(rowIndex, colIndex)}
                >
                  {piece && (
                    <img src={`${pieceImages[piece]}`} className="w-14 h-14" />
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
