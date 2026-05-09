import { useEffect, useState } from "react";
import { z } from "zod";
import BoardComponent from "./board";
import { boardToFen, fenToBoard } from "./util/board-helper";
import { GameStateSchema } from "./validator/commonValidator";
import { validateMove } from "./wasm/chessEngine";

const AppComponent = () => {
  const [location, setLocation] = useState<`${string}${number}` | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  // initialise a game
  const gameSaved = JSON.parse(localStorage.getItem("GameState") || "{}");
  const game = GameStateSchema.safeParse(gameSaved).data;
  const [gameState, setGameState] = useState<z.infer<typeof GameStateSchema>>(
    () => {
      if (game) {
        return game;
      } else {
        const gameState = {
          board: fenToBoard(
            "RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr w KQKQ - 0 1",
          ),
          castling: [
            {
              isCastlingPossible: true,
              isCastlingPossibleNow: false,
              for: "K",
            },
            {
              isCastlingPossible: true,
              isCastlingPossibleNow: false,
              for: "Q",
            },
            {
              isCastlingPossible: true,
              isCastlingPossibleNow: false,
              for: "k",
            },
            {
              isCastlingPossible: true,
              isCastlingPossibleNow: false,
              for: "q",
            },
          ],
          enPassant: "-",
          fullMoves: 0,
          halfMoves: 0,
          turnToPlay: "WHITE",
          whiteKingsLocation: "d1",
          blackKingsLocation: "d8",
        } as z.infer<typeof GameStateSchema>;
        localStorage.setItem("GameState", JSON.stringify(gameState));
        return gameState;
      }
    },
  );

  useEffect(() => {
    if (!location) return;

    let isActive = true;

    // FEN castling availability encodes *rights* (KQkq), not whether castling is
    // currently legal in the position (empty squares / check / attacks).
    const castling = gameState.castling.reduce((acc, curr) => {
      if (curr.isCastlingPossible) return acc + curr.for;
      return acc;
    }, "");

    localStorage.setItem("GameState", JSON.stringify(gameState));

    const fen =
      boardToFen(gameState.board) +
      " " +
      (gameState.turnToPlay === "WHITE" ? "w" : "b") +
      " " +
      castling +
      " " +
      gameState.enPassant +
      " " +
      gameState.fullMoves +
      " " +
      gameState.halfMoves;

    const run = async () => {
      const result = await validateMove(
        fen,
        location,
        gameState.turnToPlay === "WHITE"
          ? gameState.whiteKingsLocation
          : gameState.blackKingsLocation,
      );

      if (isActive) {
        setLegalMoves(result);
      }
    };

    run();

    return () => {
      // This is used in case if the setLegalMoves takes time and the user clicks another piece, we don't want to update the legal moves of the previous piece
      isActive = false;
    };
  }, [
    location,
    gameState.board,
    gameState.turnToPlay,
    gameState.castling,
    gameState.enPassant,
    gameState.fullMoves,
    gameState.halfMoves,
    gameState.whiteKingsLocation,
    gameState.blackKingsLocation,
  ]);

  return (
    <BoardComponent
      gameState={gameState}
      setGameState={setGameState}
      setLocation={setLocation}
      legalMoves={legalMoves}
      setLegalMoves={setLegalMoves}
    />
  ); // <MoveInfo location />;
};

export default AppComponent;
