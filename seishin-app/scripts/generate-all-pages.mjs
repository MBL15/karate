import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pagesDir = path.join(root, 'src/pages')

function transform(code, exportName, urlMap) {
  let out = code
  out = out.replace(/^import \{ motion \} from "motion\/react";\n/m, '')
  out = out.replace(/motion\.div/g, 'div')
  out = out.replace(/export default function Component\(\)/, `export function ${exportName}()`)
  for (const [from, to] of Object.entries(urlMap)) {
    out = out.split(from).join(to)
  }
  const cut = out.indexOf('\nSUPER CRITICAL')
  if (cut !== -1) out = out.slice(0, cut)
  const remaining = [...out.matchAll(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"]+/g)]
  if (remaining.length) {
    console.warn(`${exportName}: unmapped URLs:`, remaining.map((m) => m[0]))
  }
  return out.trim() + '\n'
}

const pages = [
  {
    fileKey: 'Fd483P0RIrdD4THhgheh5Z',
    nodeId: '13:2142',
    out: 'ParentHome.tsx',
    exportName: 'ParentHome',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/d001d9b2-df52-4d67-b923-9d5a4a04e827.svg': '/assets/parent/bell.svg',
      'https://www.figma.com/api/mcp/asset/b48f4abb-4081-4196-b450-823343b3cc09.svg': '/assets/parent/avatar.svg',
      'https://www.figma.com/api/mcp/asset/e70d5cff-a137-42fd-bc63-ef92f4a0c35b.svg': '/assets/parent/trophy.svg',
      'https://www.figma.com/api/mcp/asset/90c7f417-b0e1-4e66-9832-6b99feadc409.svg': '/assets/parent/house.svg',
      'https://www.figma.com/api/mcp/asset/c760993f-1a6f-4c7c-8c08-8d9449e6e4de.svg': '/assets/parent/user.svg',
      'https://www.figma.com/api/mcp/asset/1e33afb0-80ba-4115-bef7-2ce2e15b69bf.svg': '/assets/parent/award.svg',
      'https://www.figma.com/api/mcp/asset/5278a374-cfb1-448b-b82f-6727e906af84.svg': '/assets/parent/folder.svg',
    },
  },
  {
    fileKey: 'Fd483P0RIrdD4THhgheh5Z',
    nodeId: '13:2201',
    out: 'ChildProfile.tsx',
    exportName: 'ChildProfile',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/416c50fa-44ee-41c0-bb5f-adccbe1a88ea.svg': '/assets/profile/arrow-left.svg',
      'https://www.figma.com/api/mcp/asset/532534a2-d8db-4b5b-9b11-77b4327e29a4.svg': '/assets/profile/bell.svg',
      'https://www.figma.com/api/mcp/asset/d7e1bd83-cc14-4668-9d05-ef5844c0a387.svg': '/assets/profile/avatar.svg',
      'https://www.figma.com/api/mcp/asset/dc283268-6cf2-4b5a-ba65-56797a2eb056.svg': '/assets/profile/house.svg',
      'https://www.figma.com/api/mcp/asset/50cb24c3-1fc8-4370-bc46-3cc50cf62bbe.svg': '/assets/profile/user.svg',
      'https://www.figma.com/api/mcp/asset/27005bc5-480c-486a-8dbd-3b7712acf3e4.svg': '/assets/profile/award.svg',
      'https://www.figma.com/api/mcp/asset/4d81e6b1-a73f-48a1-b6eb-ec8956cf4414.svg': '/assets/profile/folder.svg',
    },
  },
  {
    fileKey: 'Fd483P0RIrdD4THhgheh5Z',
    nodeId: '13:2264',
    out: 'Achievements.tsx',
    exportName: 'Achievements',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/0506c72b-c2f9-49cc-925d-cdb5f330d1b0.svg': '/assets/achievements/bell.svg',
      'https://www.figma.com/api/mcp/asset/67dd70ce-bbfa-4562-bc00-fe9eea37c6e7.svg': '/assets/achievements/award-medal.svg',
      'https://www.figma.com/api/mcp/asset/b292fbb6-b363-4382-b691-f16ccae5c917.svg': '/assets/achievements/star-off.svg',
      'https://www.figma.com/api/mcp/asset/5c9b84f4-dbb3-4d3a-b1f8-f2a31e18a4d6.svg': '/assets/achievements/flame.svg',
      'https://www.figma.com/api/mcp/asset/348208f9-da48-4626-b9da-8e93b848662f.svg': '/assets/achievements/shield.svg',
      'https://www.figma.com/api/mcp/asset/7244b6c1-0b87-4ff0-9e68-88aa0f3449c6.svg': '/assets/achievements/house.svg',
      'https://www.figma.com/api/mcp/asset/66378f14-1a3b-4144-9048-389e8911c35d.svg': '/assets/achievements/user.svg',
      'https://www.figma.com/api/mcp/asset/c4eec7aa-f3e3-4d38-9291-99a85d6dd611.svg': '/assets/achievements/award-nav.svg',
      'https://www.figma.com/api/mcp/asset/98c5a458-15a0-4e91-af32-9b331f2dad09.svg': '/assets/achievements/folder.svg',
    },
  },
  {
    fileKey: 'Fd483P0RIrdD4THhgheh5Z',
    nodeId: '13:2323',
    out: 'CompetitionInvite.tsx',
    exportName: 'CompetitionInvite',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/ea4b5c7f-cc64-4b43-b0fe-a9776d4a2102.svg': '/assets/competition/arrow-left.svg',
      'https://www.figma.com/api/mcp/asset/fd24ba5e-710e-4345-aebd-c93118e4002f.svg': '/assets/competition/bell.svg',
      'https://www.figma.com/api/mcp/asset/3f2ccbb1-8672-42a3-ac44-794d039a3905.svg': '/assets/competition/calendar.svg',
      'https://www.figma.com/api/mcp/asset/7375fa0c-fd7a-42bc-9763-4b0d345bc3f4.svg': '/assets/competition/map-pin.svg',
      'https://www.figma.com/api/mcp/asset/991ec35f-dd5d-420d-9997-ae0130032cfd.svg': '/assets/competition/activity.svg',
      'https://www.figma.com/api/mcp/asset/4a902baa-e30f-4409-a4d2-6ec8454f30da.svg': '/assets/competition/ruble.svg',
      'https://www.figma.com/api/mcp/asset/f7910db2-0845-4ce1-9ea0-e7aab5309440.svg': '/assets/competition/house.svg',
      'https://www.figma.com/api/mcp/asset/0f596927-f829-4b90-b4ec-3240d0a227e3.svg': '/assets/competition/user.svg',
      'https://www.figma.com/api/mcp/asset/e1c14591-8819-4612-984c-1771830b54b3.svg': '/assets/competition/award.svg',
      'https://www.figma.com/api/mcp/asset/4321c8d1-cbca-4967-8301-251419a3cedf.svg': '/assets/competition/folder.svg',
    },
  },
  {
    fileKey: 'Fd483P0RIrdD4THhgheh5Z',
    nodeId: '13:2376',
    out: 'HistoryDocuments.tsx',
    exportName: 'HistoryDocuments',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/2916b135-e069-4bc0-97ae-f72694934d6b.svg': '/assets/history/bell.svg',
      'https://www.figma.com/api/mcp/asset/b63e8659-7262-4293-a87c-2e47974b6bf1.svg': '/assets/history/file-text.svg',
      'https://www.figma.com/api/mcp/asset/8951bd5e-4c59-44a7-a73f-e20b1d12323f.svg': '/assets/history/house.svg',
      'https://www.figma.com/api/mcp/asset/324bb29e-7519-4c42-868b-14110df63202.svg': '/assets/history/user.svg',
      'https://www.figma.com/api/mcp/asset/e59a6524-6ba2-4983-9ccd-4cedb48fede3.svg': '/assets/history/award.svg',
      'https://www.figma.com/api/mcp/asset/217e0bd0-3a26-4246-a05f-071bf41a4b23.svg': '/assets/history/folder.svg',
    },
  },
]

const coachSource = 'C:/Users/matve/.cursor/projects/c-Users-matve-3/agent-tools/f25c3340-7521-480b-bb94-300dcf1988ac.txt'
const coachUrlMap = {
  'https://www.figma.com/api/mcp/asset/b4ba9ad4-0017-4544-8d51-5b6a4ddca5fc.svg': '/assets/coach/grid.svg',
  'https://www.figma.com/api/mcp/asset/4dd6fbf6-9c66-468c-94f5-343403a3c0f8.svg': '/assets/coach/users.svg',
  'https://www.figma.com/api/mcp/asset/9b4a3be5-b537-4d06-98f4-65c3fba1aefe.svg': '/assets/coach/calendar.svg',
  'https://www.figma.com/api/mcp/asset/91511142-2d35-4278-8eac-5852125d288f.svg': '/assets/coach/award.svg',
  'https://www.figma.com/api/mcp/asset/48ed02e8-5456-446e-b9e5-87b906aea793.svg': '/assets/coach/trophy.svg',
  'https://www.figma.com/api/mcp/asset/99766650-87d2-487b-8acd-bbfdd0a710c3.svg': '/assets/coach/wallet.svg',
  'https://www.figma.com/api/mcp/asset/1fda9d96-a0aa-4ccb-8424-c05768bcc1f0.svg': '/assets/coach/avatar-coach.svg',
  'https://www.figma.com/api/mcp/asset/fccd9a80-edb5-44ec-9421-f465e4c03364.svg': '/assets/coach/bell.svg',
  'https://www.figma.com/api/mcp/asset/6c77be37-9e95-45c9-99af-e02498b0bf16.svg': '/assets/coach/avatar-student.svg',
  'https://www.figma.com/api/mcp/asset/c2003b6f-cb24-4e5d-a79d-663d3361ed31.svg': '/assets/coach/divider.svg',
  'https://www.figma.com/api/mcp/asset/e0da173f-ab5d-4b7a-82e1-fa55234c966d.svg': '/assets/coach/award-action.svg',
  'https://www.figma.com/api/mcp/asset/c846be5b-7ebf-4057-abe4-9956d8491ea2.svg': '/assets/coach/star-off.svg',
  'https://www.figma.com/api/mcp/asset/4333aff0-e70a-45d4-bdee-50249285a79c.svg': '/assets/coach/message.svg',
  'https://www.figma.com/api/mcp/asset/936016d0-490d-422f-8216-7ceed093991d.svg': '/assets/coach/file-plus.svg',
  'https://www.figma.com/api/mcp/asset/c5128aed-65a0-4114-a5d1-2c177efab00d.svg': '/assets/coach/birthday-1.svg',
  'https://www.figma.com/api/mcp/asset/8aa5ffd9-8d84-46c1-89ba-dac54b97dc57.svg': '/assets/coach/birthday-2.svg',
}

await mkdir(pagesDir, { recursive: true })

for (const page of pages) {
  const rawPath = path.join(__dirname, 'raw', `${page.nodeId.replace(':', '-')}.txt`)
  let code = await readFile(rawPath, 'utf8')
  code = transform(code, page.exportName, page.urlMap)
  await writeFile(path.join(pagesDir, page.out), code)
  console.log('Generated', page.out)
}

let coachCode = await readFile(coachSource, 'utf8')
coachCode = transform(coachCode, 'CoachDashboard', coachUrlMap)
await writeFile(path.join(pagesDir, 'CoachDashboard.tsx'), coachCode)
console.log('Generated CoachDashboard.tsx')
