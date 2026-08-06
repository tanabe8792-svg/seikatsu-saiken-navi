/**
 * CLI: npm run validate:scenarios
 * npx tsx src/lib/knowledge/run-validation-scenarios.ts
 */
import {
  formatValidationReport,
  runAllValidationScenarios,
} from "./validation-scenarios";

const report = runAllValidationScenarios();
console.log(formatValidationReport(report));
console.log("\n--- JSON ---\n");
console.log(JSON.stringify(report, null, 2));
process.exit(report.failed > 0 ? 1 : 0);
