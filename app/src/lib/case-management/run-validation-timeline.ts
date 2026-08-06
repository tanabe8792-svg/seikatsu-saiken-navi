import {
  formatTimelineReport,
  runAllTimelineValidations,
} from "./validation-timeline";

const report = runAllTimelineValidations();
console.log(formatTimelineReport());
process.exit(report.passed === report.total ? 0 : 1);
