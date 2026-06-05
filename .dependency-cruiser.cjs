/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "runtime-not-to-react",
      severity: "error",
      comment: "Runtime must stay React-free (ADR-002)",
      from: { path: "^packages/runtime" },
      to: { path: "^packages/react" }
    },
    {
      name: "react-not-to-bridge",
      severity: "error",
      comment: "React layer must not depend on bridge (ADR-005)",
      from: { path: "^packages/react" },
      to: { path: "^packages/bridge" }
    }
  ],
  options: {
    doNotFollow: {
      path: "node_modules"
    },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    exclude: {
      path: "(^|/)(dist|coverage|\\.next|\\.turbo)(/|$)"
    }
  }
};
