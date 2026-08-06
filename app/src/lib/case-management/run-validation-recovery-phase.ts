import {
  formatRecoveryPhaseReport,
  runAllRecoveryPhaseValidations,
} from "./validation-recovery-phase";

const report = runAllRecoveryPhaseValidations();
console.log(formatRecoveryPhaseReport());
process.exit(report.passed === report.total ? 0 : 1);
