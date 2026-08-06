import {
  formatOnboardingReport,
  runAllOnboardingValidations,
} from "./validation-onboarding";

const report = runAllOnboardingValidations();
console.log(formatOnboardingReport());
process.exit(report.passed === report.total ? 0 : 1);
