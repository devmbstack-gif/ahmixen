export type MissionContent = {
  title: string;
  sub: string;
  accentLine: string;
  story: {
    text: string;
    link: { label: string; href: string };
  };
};

export const MISSION: MissionContent = {
  title: 'Our Mission',
  sub: 'We teach practical AI in plain words, so you can use it at work the same day.',
  accentLine: 'To win the AI race, we have to use AI',
  story: {
    // CONFIRM THIS TEXT WITH THE FOUNDER BEFORE LAUNCH
    text: 'AhmiXen is an AI agency started with one idea: AI should be accessible to everyone.',
    link: { label: 'ahmixen.com', href: 'https://ahmixen.com' },
  },
};
