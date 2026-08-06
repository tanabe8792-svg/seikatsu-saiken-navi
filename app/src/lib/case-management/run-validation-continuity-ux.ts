import {
  formatContinuityUxReport,
  runAllContinuityUxValidations,
} from "./validation-continuity-ux";

const report = runAllContinuityUxValidations();
console.log(formatContinuityUxReport());
process.exit(report.passed === report.total ? 0 : 1);
