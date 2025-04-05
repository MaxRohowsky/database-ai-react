interface Window {
    electronAPI: {
      sayHi: () => string;
      testConnection: (connectionDetails: ConnectionDetails) => Promise<boolean>;
    };
    // other properties...
  }