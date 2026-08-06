import {
  formatSurvivorScenarioReport,
  runAllSurvivorScenarioValidations,
} from "./validation-survivor-scenarios";

const report = runAllSurvivorScenarioValidations();
console.log(formatSurvivorScenarioReport());
process.exit(report.passed === report.total ? 0 : 1);
