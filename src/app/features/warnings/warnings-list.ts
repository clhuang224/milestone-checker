import { Component, input } from '@angular/core';

import { Rule, RuleSeverity } from '../../models/rule.model';

/**
 * The three severities are the one place colour carries meaning rather than decoration, so they
 * keep their own tokens (see `styles.css`) instead of borrowing the app's accent.
 */
const SEVERITY_STYLES: Record<RuleSeverity, string> = {
  critical: 'sev-critical',
  warning: 'sev-warning',
  info: 'sev-info',
};

const SEVERITY_LABELS: Record<RuleSeverity, string> = {
  critical: '重要',
  warning: '警示',
  info: '提示',
};

@Component({
  selector: 'app-warnings-list',
  templateUrl: './warnings-list.html',
})
export class WarningsList {
  readonly triggeredRules = input.required<Rule[]>();

  severityClass(severity: RuleSeverity): string {
    return SEVERITY_STYLES[severity];
  }

  severityLabel(severity: RuleSeverity): string {
    return SEVERITY_LABELS[severity];
  }
}
