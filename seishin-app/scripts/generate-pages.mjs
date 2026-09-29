import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pagesDir = path.join(root, 'src/pages')

const mappings = [
  {
    source: 'C:/Users/matve/.cursor/projects/c-Users-matve-3/agent-tools/fc8b2e8d-552b-44dc-9682-221a3081d3f4.txt',
    out: 'CoachDashboard.tsx',
    exportName: 'CoachDashboard',
    urlMap: {
      'https://www.figma.com/api/mcp/asset/bd198681-2d0f-4e1f-87ca-662e8c175a17.svg': '/assets/coach/grid.svg',
      'https://www.figma.com/api/mcp/asset/63ff80ba-fdaf-40ae-9f80-87a990baee9a.svg': '/assets/coach/users.svg',
      'https://www.figma.com/api/mcp/asset/afeff766-22fc-412e-b906-bd6d4e973bbb.svg': '/assets/coach/calendar.svg',
      'https://www.figma.com/api/mcp/asset/8ea8a916-105a-4a83-8e32-d584a7ae06fb.svg': '/assets/coach/award.svg',
      'https://www.figma.com/api/mcp/asset/8176e08b-6d04-42c1-b6ab-da6ff15df62e.svg': '/assets/coach/trophy.svg',
      'https://www.figma.com/api/mcp/asset/e00f4b08-bea2-4891-b65a-f86f172fadbd.svg': '/assets/coach/wallet.svg',
      'https://www.figma.com/api/mcp/asset/92fde038-6ee8-4843-a081-443fca7853c5.svg': '/assets/coach/avatar-coach.svg',
      'https://www.figma.com/api/mcp/asset/ab0a74f4-f3a4-4a23-9d2b-93e79bdec46f.svg': '/assets/coach/bell.svg',
      'https://www.figma.com/api/mcp/asset/bc6492f9-5eb7-436f-8a52-36d0f0ad49d7.svg': '/assets/coach/avatar-student.svg',
      'https://www.figma.com/api/mcp/asset/70057a1b-3701-4eec-b8e2-66c47577373c.svg': '/assets/coach/divider.svg',
      'https://www.figma.com/api/mcp/asset/ff5a803a-823c-4eee-bedd-c581e93f633a.svg': '/assets/coach/award-action.svg',
      'https://www.figma.com/api/mcp/asset/c8d129bb-bbfc-4453-a658-5df5494960c5.svg': '/assets/coach/star-off.svg',
      'https://www.figma.com/api/mcp/asset/a536914c-08f2-4818-bcdf-fb4fdf313fca.svg': '/assets/coach/message.svg',
      'https://www.figma.com/api/mcp/asset/52c09984-38c7-456f-a378-069f00ec68d4.svg': '/assets/coach/file-plus.svg',
      'https://www.figma.com/api/mcp/asset/30f12fda-cd6f-4300-a15f-48d8c4942b72.svg': '/assets/coach/birthday-1.svg',
      'https://www.figma.com/api/mcp/asset/27261edc-61d8-4457-87b2-8b8ffc1eec0b.svg': '/assets/coach/birthday-2.svg',
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
    },
  },
]

function transform(code, exportName, urlMap) {
  let out = code
  out = out.replace(/^import \{ motion \} from "motion\/react";\n/m, '')
  out = out.replace(/motion\.div/g, 'div')
  out = out.replace(/export default function Component\(\)/, `export function ${exportName}()`)
  for (const [from, to] of Object.entries(urlMap)) {
    out = out.split(from).join(to)
  }
  const generic = [...out.matchAll(/https:\/\/www\.figma\.com\/api\/mcp\/asset\/[^"]+\.svg/g)]
  for (const match of generic) {
    console.warn('Unmapped URL:', match[0])
  }
  const cut = out.indexOf('\nSUPER CRITICAL')
  if (cut !== -1) out = out.slice(0, cut)
  return out.trim() + '\n'
}

await mkdir(pagesDir, { recursive: true })

for (const item of mappings) {
  let code = await readFile(item.source, 'utf8')
  code = transform(code, item.exportName, item.urlMap)
  await writeFile(path.join(pagesDir, item.out), code)
  console.log('Generated', item.out)
}
