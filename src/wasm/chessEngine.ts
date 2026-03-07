import ChessValidator from "./chess_validator.js";

export type ValidateMove = (
  fen: string,
  pieceMove: string,
  kingMove: string
) => Promise<string[]>;

type ChessValidatorModule = {
  ccall: (
    name: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => unknown;
};

let moduleInstance: ChessValidatorModule | null = null;

async function loadModule(): Promise<ChessValidatorModule> {
  if (!moduleInstance) {
    moduleInstance = await ChessValidator({
      locateFile: (file: string) => `/src/wasm/${file}`,
    });
  }

  return moduleInstance;
}

export const validateMove: ValidateMove = async (
  fen,
  pieceMove,
  kingMove
) => {
  const mod = await loadModule();

  const result = mod.ccall(
    "validateMove",
    "string",
    ["string", "string", "string"],
    [fen, pieceMove, kingMove]
  ) as string;

  return result.split(",");
};