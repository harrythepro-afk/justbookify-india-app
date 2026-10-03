// @shopify/checkout-sheet-kit publishes its TypeScript source as its types entry, so the type
// check reads that source. It calls Error.captureStackTrace, a V8 method Hermes also provides,
// which the app's types do not declare because Node's types are not loaded (tsconfig `types`).
// The signature matches @types/node, so the two merge if Node's types are ever loaded.
interface ErrorConstructor {
  captureStackTrace(targetObject: object, constructorOpt?: Function): void;
}
