import {
  formatDecisionExplanationReport,
  runAllDecisionExplanationValidations,
} from "./validation-decision-explanation";

const report = runAllDecisionExplanationValidations();
console.log(formatDecisionExplanationReport());
process.exit(report.passed === report.total ? 0 : 1);
