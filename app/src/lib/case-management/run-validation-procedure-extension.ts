import {
  formatProcedureExtensionReport,
  runAllProcedureExtensionValidations,
} from "./validation-procedure-extension";

const report = runAllProcedureExtensionValidations();
console.log(formatProcedureExtensionReport());
process.exit(report.passed === report.total ? 0 : 1);
