import { runSurvivorCopyValidation } from "./validation-survivor-copy";

const { result, report } = runSurvivorCopyValidation();
console.log(report);
console.log("");
console.log(
  `Checked ${result.checked} strings — ${result.passed ? "PASSED" : `FAILED (${result.failures} issues)`}`
);
process.exit(result.passed ? 0 : 1);
