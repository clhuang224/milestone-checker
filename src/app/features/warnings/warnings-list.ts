import { Component, input } from '@angular/core';

import { Rule, RuleSeverity } from '../../models/rule.model';

const SEVERITY_STYLES: Record<RuleSeverity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  warning: 'bg-amber-100 text-amber-800 border-amber-300',
  info: 'bg-sky-100 text-sky-800 border-sky-300',
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
