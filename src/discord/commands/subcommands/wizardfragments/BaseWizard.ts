import type { InitWizard } from "../init.js";


class BaseWizard {
  initWizard: InitWizard;

  constructor(initWizard: InitWizard) {
    this.initWizard = initWizard;
  }
}

export default BaseWizard;