import { formatProcedureReport, runAllProcedureValidations } from "./validation-procedures";

const report = runAllProcedureValidations();
console.log(formatProcedureReport());
process.exit(report.passed === report.total ? 0 : 1);
