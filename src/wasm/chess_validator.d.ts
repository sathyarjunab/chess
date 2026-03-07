type EmscriptenModule = {
  ccall: (
    ident: string,
    returnType: string,
    argTypes: string[],
    args: any[],
  ) => any;
};

interface ChessValidatorFactory {
  (options?: {
    locateFile?: (path: string) => string;
  }): Promise<EmscriptenModule>;
}

declare const ChessValidator: ChessValidatorFactory;

export default ChessValidator;
