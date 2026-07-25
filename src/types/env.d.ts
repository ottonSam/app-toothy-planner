declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_BASE_URL?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
