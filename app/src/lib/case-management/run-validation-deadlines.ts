import {
  formatDeadlineReport,
  runAllDeadlineValidations,
} from "./validation-deadlines";

const report = runAllDeadlineValidations();
console.log(formatDeadlineReport());
process.exit(report.passed === report.total ? 0 : 1);
