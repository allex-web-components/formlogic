var lR = ALLEX.execSuite.libRegistry,
  applib = lR.get('allex_applib'),
  jqueryelementslib = lR.get('allex_jqueryelementslib'),
  formvalidationlib = lR.get('allex_formvalidationlib');

require('./creator')(ALLEX, applib, jqueryelementslib, formvalidationlib);
