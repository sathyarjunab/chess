declare module "*.wasm" {
  const value: any;
  export default value;
}

declare module "*/chess_validator.js" {
  const ChessValidator: any;
  export default ChessValidator;
}
