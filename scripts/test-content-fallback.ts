/**
 * Assert content resolvers fall back to static defaults when Mongo is unreachable.
 * (Uncached path — same fallback the public getters use inside unstable_cache.)
 */
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/unreachable_test';

async function main() {
  const { resolveContentKey } = await import('../src/lib/content/landingPublic');
  const {
    heroDataSchema,
    learnDataSchema,
    seoDataSchema,
    statsDataSchema,
    programsDataSchema,
    previewDataSchema,
    agendaDataSchema,
    aiJobsDataSchema,
    heroStaticDefault,
    learnStaticDefault,
    seoStaticDefault,
    previewStaticDefault,
    agendaStaticDefault,
    aiJobsStaticDefault,
    statsStaticDefault,
    programsStaticDefault,
  } = await import('../src/lib/content/landingSchemas');
  const { instructorDataSchema, missionDataSchema } = await import(
    '../src/lib/content/registry'
  );
  const { instructor } = await import('../src/data/instructor');
  const { MISSION } = await import('../src/data/mission');

  const hero = await resolveContentKey('hero', heroDataSchema);
  const learn = await resolveContentKey('learn', learnDataSchema);
  const seo = await resolveContentKey('seo', seoDataSchema);
  const stats = await resolveContentKey('stats', statsDataSchema);
  const programs = await resolveContentKey('programs', programsDataSchema);
  const preview = await resolveContentKey('preview', previewDataSchema);
  const agenda = await resolveContentKey('agenda', agendaDataSchema);
  const aiJobs = await resolveContentKey('aiJobs', aiJobsDataSchema);
  const inst = await resolveContentKey('instructor', instructorDataSchema);
  const mission = await resolveContentKey('mission', missionDataSchema);

  const checks: Array<[string, boolean, string]> = [
    [
      'hero',
      hero.headlineLine1 === heroStaticDefault.headlineLine1,
      hero.headlineLine1,
    ],
    [
      'learn',
      learn.items[0]?.title === learnStaticDefault.items[0]?.title,
      learn.items[0]?.title || '',
    ],
    ['seo', seo.home.title === seoStaticDefault.home.title, seo.home.title],
    [
      'stats',
      stats.items[0]?.id === statsStaticDefault.items[0]?.id,
      String(stats.items[0]?.id),
    ],
    [
      'programs',
      programs.cards[0]?.id === programsStaticDefault.cards[0]?.id,
      String(programs.cards[0]?.id),
    ],
    [
      'preview',
      preview.heading === previewStaticDefault.heading,
      preview.heading,
    ],
    [
      'agenda',
      agenda.comingSoon === agendaStaticDefault.comingSoon,
      String(agenda.comingSoon),
    ],
    [
      'aiJobs',
      aiJobs.eyebrow === aiJobsStaticDefault.eyebrow,
      aiJobs.eyebrow,
    ],
    ['instructor', inst.name === instructor.name, inst.name],
    ['mission', mission.title === MISSION.title, mission.title],
  ];

  let failed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} — ${detail}`);
    if (!ok) failed += 1;
  }
  if (failed) process.exit(1);
  console.log('FALLBACK_OK');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
