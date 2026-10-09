import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../public/benefits');

const sources = {
  dark: 'C:/Users/sb/.cursor/projects/d-blog-site-ahmixen/assets/c__Users_sb_AppData_Roaming_Cursor_User_workspaceStorage_2daa28724ac8eaebd309b577cabde2f5_images_image-0aecc307-b728-4590-b82e-6deca9accca8.png',
  light:
    'C:/Users/sb/.cursor/projects/d-blog-site-ahmixen/assets/c__Users_sb_AppData_Roaming_Cursor_User_workspaceStorage_2daa28724ac8eaebd309b577cabde2f5_images_image-04b3f1c1-2679-42e8-9755-70649a6db7fe.png',
};

const ids = ['fundamentals', 'agents', 'automation', 'building'];

/** Relative crop regions for 2x2 card grids (fractions of width/height) */
const grids = {
  dark: {
    // Skip header; cards fill most of the remaining area
    top: 0.145,
    bottom: 0.035,
    left: 0.055,
    right: 0.055,
    gapX: 0.018,
    gapY: 0.025,
  },
  light: {
    top: 0.155,
    bottom: 0.04,
    left: 0.055,
    right: 0.055,
    gapX: 0.018,
    gapY: 0.028,
  },
};

async function cropTheme(theme) {
  const img = sharp(sources[theme]);
  const { width, height } = await img.metadata();
  const g = grids[theme];

  const contentLeft = Math.round(width * g.left);
  const contentRight = Math.round(width * (1 - g.right));
  const contentTop = Math.round(height * g.top);
  const contentBottom = Math.round(height * (1 - g.bottom));
  const contentW = contentRight - contentLeft;
  const contentH = contentBottom - contentTop;
  const gapX = Math.round(width * g.gapX);
  const gapY = Math.round(height * g.gapY);
  const cardW = Math.floor((contentW - gapX) / 2);
  const cardH = Math.floor((contentH - gapY) / 2);

  const positions = [
    { left: contentLeft, top: contentTop }, // fundamentals
    { left: contentLeft + cardW + gapX, top: contentTop }, // agents
    { left: contentLeft, top: contentTop + cardH + gapY }, // automation
    { left: contentLeft + cardW + gapX, top: contentTop + cardH + gapY }, // building
  ];

  for (let i = 0; i < 4; i++) {
    const out = path.join(outDir, `${ids[i]}-${theme}.png`);
    await sharp(sources[theme])
      .extract({
        left: positions[i].left,
        top: positions[i].top,
        width: cardW,
        height: cardH,
      })
      .png()
      .toFile(out);
    console.log('wrote', out, cardW, cardH);
  }
}

await cropTheme('dark');
await cropTheme('light');
console.log('done');
