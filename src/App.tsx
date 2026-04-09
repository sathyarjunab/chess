import { useEffect, useState } from "react";
import { z } from "zod";
import BoardComponent from "./board";
import { boardToFen, fenToBoard } from "./util/bord-helper";
import { GameStateSchema } from "./validator/commonValidator";
import { validateMove } from "./wasm/chessEngine";
import { yo } from "zod/locales";

const AppComponent = () => {
  const [location, setLocation] = useState<string | undefined>(undefined);
  const [youMightMove, setYouMightMove] = useState<string[]>([]);
  // initialise a game
  const gameSaved = JSON.parse(localStorage.getItem("GameState") || "{}");
  const game = GameStateSchema.safeParse(gameSaved).data;
  const [gameState, setGameState] = useState<z.infer<typeof GameStateSchema>>(
    () => {
      if (game) {
        return game;
      } else {
        return {
          board: fenToBoard(
            "RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr w - - 0 1",
          ),
          castling: "-",
          enPassant: "-",
          fullMoves: 0,
          halfMoves: 0,
          turnToPlay: "WHITE",
          whiteKingsLocation: "d1",
          blackKingsLocation: "d8",
        };
      }
    },
  );

  useEffect(() => {
    if (!location) return;
    console.log(location);

    const run = async () => {
      const fen =
        boardToFen(gameState.board) +
        " " +
        (gameState.turnToPlay === "WHITE" ? "w" : "b") +
        " " +
        gameState.castling +
        " " +
        gameState.enPassant +
        " " +
        gameState.fullMoves +
        " " +
        gameState.halfMoves;

      const result = await validateMove(
        fen,
        location,
        gameState.turnToPlay === "WHITE"
          ? gameState.whiteKingsLocation
          : gameState.blackKingsLocation,
      );
      setYouMightMove(result);
    };

    run();
  }, [location, gameState]);
  return (
    <BoardComponent
      gameState={gameState}
      setGameState={setGameState}
      setLocation={setLocation}
      youMightMove={youMightMove}
    />
  ); // <MoveInfo location />;
};

export default AppComponent;
