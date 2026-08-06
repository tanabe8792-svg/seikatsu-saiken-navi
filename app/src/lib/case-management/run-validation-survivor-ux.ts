import {
  formatSurvivorUxReport,
  runAllSurvivorUxValidations,
} from "./validation-survivor-ux";

const report = runAllSurvivorUxValidations();
console.log(formatSurvivorUxReport());
process.exit(report.passed === report.total ? 0 : 1);
