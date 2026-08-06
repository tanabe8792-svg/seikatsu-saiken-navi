import {
  formatDocumentReport,
  runAllDocumentValidations,
} from "./validation-documents";

const report = runAllDocumentValidations();
console.log(formatDocumentReport());
process.exit(report.passed === report.total ? 0 : 1);
