import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { todayISO } from './core/age';
import { Storage } from './core/storage/storage';
import { STARTER_ARTICULATION_PROCESSES } from './data/starter-articulation-processes';
import { starterCaseSeed } from './data/starter-cases';
import { STARTER_FINDINGS } from './data/starter-findings';
import { STARTER_RULES } from './data/starter-rules';
import { DisclaimerBanner } from './shared/disclaimer-banner/disclaimer-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DisclaimerBanner],
  templateUrl: './app.html',
})
export class App {
  private readonly storage = inject(Storage);

  constructor() {
    if (this.storage.findings().length === 0) {
      STARTER_FINDINGS.forEach((finding) => this.storage.upsertFinding(finding));
    }
    if (this.storage.rules().length === 0) {
      STARTER_RULES.forEach((rule) => this.storage.upsertRule(rule));
    }
    if (this.storage.articulationProcesses().length === 0) {
      STARTER_ARTICULATION_PROCESSES.forEach((process) =>
        this.storage.upsertArticulationProcess(process),
      );
    }
    // Seeded last: the demo case's pairs reference the process ids seeded just above.
    if (this.storage.cases().length === 0) {
      const seed = starterCaseSeed(todayISO());
      this.storage.upsertCase(seed.caseRecord);
      this.storage.upsertAssessment(seed.assessment);
      this.storage.saveProfile(seed.profile);
      seed.substitutions.forEach((substitution) => this.storage.upsertSubstitution(substitution));
    }
  }
}
