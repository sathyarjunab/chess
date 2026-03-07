import { useEffect, useState } from "react";
import BoardComponent from "./board";
import { validateMove } from "./wasm/chessEngine";

// type MoveInfo = {
//   location: string;
// };

const AppComponent = () => {
  const game = "7k/5Q2/7K/8/8/8/8/8 b - - 0 1";
  const [pieceLocation, setPieceLocation] = useState<string>();

  async function getMoves() {
    try {
      const result = await validateMove(game, pieceLocation ?? "", "h8");
      console.log(result);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    console.log(pieceLocation);
    console.log(pieceLocation ?? "");
    getMoves();
  }, [pieceLocation]);

  // const prevGame = localStorage.getItem("FEN");
  // if (prevGame) {
  //   game = prevGame;
  // }

  return <BoardComponent fen={game} setPieceLocation={setPieceLocation} />; // <MoveInfo location />;
};

export default AppComponent;
