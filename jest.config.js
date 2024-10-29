export default {
    transform: {
      "^.+\\.js$": "babel-jest"
    },
    testEnvironment: "node",
    moduleNameMapper: {
      "^(.+\\.(js|jsx|ts|tsx))$": "$1"
    },
  };
  
  