import { readFileSync, writeFileSync } from 'node:fs'

const files = [
  'ParentHome.tsx',
  'ChildProfile.tsx',
  'Achievements.tsx',
  'CompetitionInvite.tsx',
  'HistoryDocuments.tsx',
]

for (const file of files) {
  const path = new URL(`../src/pages/${file}`, import.meta.url)
  let src = readFileSync(path, 'utf8')

  if (!src.includes('ParentBottomNav')) {
    src = `import { ParentBottomNav } from '../components/parent/ParentBottomNav';\n` + src
  }

  src = src.replace(
    /bg-\[#f4f7fa\] content-stretch flex flex-col items-start relative size-full/g,
    'bg-[#f4f7fa] flex h-full flex-col items-stretch overflow-hidden',
  )

  src = src.replace(
    /className="content-stretch flex flex-\[1_0_0\] flex-col gap-\[16px\]/g,
    'className="flex flex-1 flex-col gap-[16px] overflow-y-auto',
  )

  src = src.replace(
    /\n      <div className="bg-white border-\[#e5eaf0\][\s\S]*?data-name="Навигация">[\s\S]*?\n      <\/div>\n    <\/div>/,
    '\n      <ParentBottomNav />\n    </div>',
  )

  writeFileSync(path, src)
  console.log('Patched', file)
}
