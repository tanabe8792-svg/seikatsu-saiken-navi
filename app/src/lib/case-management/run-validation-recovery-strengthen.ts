import {
  formatRecoveryStrengthenReport,
  runAllRecoveryStrengthenValidations,
} from "./validation-recovery-strengthen";

const report = runAllRecoveryStrengthenValidations();
console.log(formatRecoveryStrengthenReport());
process.exit(report.passed === report.total ? 0 : 1);
