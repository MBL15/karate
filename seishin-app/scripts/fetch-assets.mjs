import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const assetsDir = path.join(__dirname, '../public/assets')

const files = {
  'parent/bell.svg': 'https://www.figma.com/api/mcp/asset/7b28b8ce-1272-4d71-88c0-2775e907f914.svg',
  'parent/avatar.svg': 'https://www.figma.com/api/mcp/asset/41f40a36-a91c-4f1a-84e4-aedb8f2d752c.svg',
  'parent/trophy.svg': 'https://www.figma.com/api/mcp/asset/6bb3b853-bee3-4b31-a372-7bbce0c3f67c.svg',
  'parent/house.svg': 'https://www.figma.com/api/mcp/asset/f4de813e-610a-4c32-9609-9f7037633ff2.svg',
  'parent/user.svg': 'https://www.figma.com/api/mcp/asset/4330a98e-0b1b-4a60-ae8f-5728946f42c1.svg',
  'parent/award.svg': 'https://www.figma.com/api/mcp/asset/1905e5a7-de3a-4778-be85-19afb87335e0.svg',
  'parent/folder.svg': 'https://www.figma.com/api/mcp/asset/8155bac8-2bcc-4485-8b26-ebc64f3db503.svg',
  'profile/arrow-left.svg': 'https://www.figma.com/api/mcp/asset/b59d07ee-96c1-4304-891a-627673086e46.svg',
  'profile/bell.svg': 'https://www.figma.com/api/mcp/asset/8fa2add4-62c5-4d83-a052-443c35072e5a.svg',
  'profile/avatar.svg': 'https://www.figma.com/api/mcp/asset/49bbdc29-ab0e-4498-9d92-b9a87004ef3c.svg',
  'profile/house.svg': 'https://www.figma.com/api/mcp/asset/625bbff0-4d38-4c4b-89e5-d01acc9b1b1e.svg',
  'profile/user.svg': 'https://www.figma.com/api/mcp/asset/27c6cd6a-6b29-494d-8e0a-4cee9359d663.svg',
  'profile/award.svg': 'https://www.figma.com/api/mcp/asset/0e64403f-4d46-472a-a1e0-56a15fac7707.svg',
  'profile/folder.svg': 'https://www.figma.com/api/mcp/asset/3eee5361-b898-4ad0-8ab8-3ae4b3002b96.svg',
  'achievements/bell.svg': 'https://www.figma.com/api/mcp/asset/3707b376-c2b2-4cf4-918e-a2102dd7c747.svg',
  'achievements/award-medal.svg': 'https://www.figma.com/api/mcp/asset/3cec153f-d07d-4f71-8d1e-df8ce985c85b.svg',
  'achievements/star-off.svg': 'https://www.figma.com/api/mcp/asset/a1eba09a-aaf2-4ce3-a1be-eab8c1f45c0a.svg',
  'achievements/flame.svg': 'https://www.figma.com/api/mcp/asset/a6a92faf-8189-4de4-ab08-9a009530d85a.svg',
  'achievements/shield.svg': 'https://www.figma.com/api/mcp/asset/7d02204b-2fcc-45e3-aff9-6b91358dff07.svg',
  'achievements/house.svg': 'https://www.figma.com/api/mcp/asset/791b295b-e273-443e-a852-c9ac7a6dbbf1.svg',
  'achievements/user.svg': 'https://www.figma.com/api/mcp/asset/98fb3014-04f0-42df-a499-54de3439406c.svg',
  'achievements/award-nav.svg': 'https://www.figma.com/api/mcp/asset/a7584f2d-be00-433d-bb63-e949f25d90b4.svg',
  'achievements/folder.svg': 'https://www.figma.com/api/mcp/asset/30023ed8-af2a-41e3-9635-ccd01d7d9dc4.svg',
  'competition/arrow-left.svg': 'https://www.figma.com/api/mcp/asset/e8780472-e3bf-48b9-8285-55d6e81d5d3a.svg',
  'competition/bell.svg': 'https://www.figma.com/api/mcp/asset/16a6fe92-4b9b-4711-b7d2-3031bdb9e3f3.svg',
  'competition/calendar.svg': 'https://www.figma.com/api/mcp/asset/f99011ee-28b3-47fd-bcb0-106d2975b8b1.svg',
  'competition/map-pin.svg': 'https://www.figma.com/api/mcp/asset/05f15e25-14f9-4671-b5c9-0ef7570cb148.svg',
  'competition/activity.svg': 'https://www.figma.com/api/mcp/asset/8dda7587-c7ce-40ab-beb7-f32a906fc792.svg',
  'competition/ruble.svg': 'https://www.figma.com/api/mcp/asset/9dae866b-4c18-457c-a8c3-539d8f22c836.svg',
  'competition/house.svg': 'https://www.figma.com/api/mcp/asset/e54bf4cb-7a6e-4adb-8fec-e1330a4ebb66.svg',
  'competition/user.svg': 'https://www.figma.com/api/mcp/asset/218445a2-805d-44b6-8941-d2f8a08ca929.svg',
  'competition/award.svg': 'https://www.figma.com/api/mcp/asset/8f600743-3cdf-48ca-90e2-3b32c3ad647c.svg',
  'competition/folder.svg': 'https://www.figma.com/api/mcp/asset/30df9355-c4b3-4c4c-a3fa-6585bf413be6.svg',
  'history/bell.svg': 'https://www.figma.com/api/mcp/asset/a070769f-9309-4f79-911a-c6312d9e7b20.svg',
  'history/file-text.svg': 'https://www.figma.com/api/mcp/asset/0d581b76-621b-4fd5-a68c-5ad834c27d6e.svg',
  'history/house.svg': 'https://www.figma.com/api/mcp/asset/e9109dae-dc4d-476e-81b5-963e482a9282.svg',
  'history/user.svg': 'https://www.figma.com/api/mcp/asset/4d95001f-8e73-44ea-aea7-ce38da8970ec.svg',
  'history/award.svg': 'https://www.figma.com/api/mcp/asset/328f3e4e-7ca8-4196-a332-2b24b4c4677a.svg',
  'history/folder.svg': 'https://www.figma.com/api/mcp/asset/c21ff354-835d-48e9-8d46-9b05bf429cdf.svg',
  'coach/grid.svg': 'https://www.figma.com/api/mcp/asset/b4ba9ad4-0017-4544-8d51-5b6a4ddca5fc.svg',
  'coach/users.svg': 'https://www.figma.com/api/mcp/asset/4dd6fbf6-9c66-468c-94f5-343403a3c0f8.svg',
  'coach/calendar.svg': 'https://www.figma.com/api/mcp/asset/9b4a3be5-b537-4d06-98f4-65c3fba1aefe.svg',
  'coach/award.svg': 'https://www.figma.com/api/mcp/asset/91511142-2d35-4278-8eac-5852125d288f.svg',
  'coach/trophy.svg': 'https://www.figma.com/api/mcp/asset/48ed02e8-5456-446e-b9e5-87b906aea793.svg',
  'coach/wallet.svg': 'https://www.figma.com/api/mcp/asset/99766650-87d2-487b-8acd-bbfdd0a710c3.svg',
  'coach/avatar-coach.svg': 'https://www.figma.com/api/mcp/asset/1fda9d96-a0aa-4ccb-8424-c05768bcc1f0.svg',
  'coach/bell.svg': 'https://www.figma.com/api/mcp/asset/fccd9a80-edb5-44ec-9421-f465e4c03364.svg',
  'coach/avatar-student.svg': 'https://www.figma.com/api/mcp/asset/6c77be37-9e95-45c9-99af-e02498b0bf16.svg',
  'coach/divider.svg': 'https://www.figma.com/api/mcp/asset/c2003b6f-cb24-4e5d-a79d-663d3361ed31.svg',
  'coach/award-action.svg': 'https://www.figma.com/api/mcp/asset/e0da173f-ab5d-4b7a-82e1-fa55234c966d.svg',
  'coach/star-off.svg': 'https://www.figma.com/api/mcp/asset/c846be5b-7ebf-4057-abe4-9956d8491ea2.svg',
  'coach/message.svg': 'https://www.figma.com/api/mcp/asset/4333aff0-e70a-45d4-bdee-50249285a79c.svg',
  'coach/file-plus.svg': 'https://www.figma.com/api/mcp/asset/936016d0-490d-422f-8216-7ceed093991d.svg',
  'coach/birthday-1.svg': 'https://www.figma.com/api/mcp/asset/c5128aed-65a0-4114-a5d1-2c177efab00d.svg',
  'coach/birthday-2.svg': 'https://www.figma.com/api/mcp/asset/8aa5ffd9-8d84-46c1-89ba-dac54b97dc57.svg',
}

await mkdir(assetsDir, { recursive: true })

for (const [name, url] of Object.entries(files)) {
  const target = path.join(assetsDir, name)
  await mkdir(path.dirname(target), { recursive: true })
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed ${name}: ${res.status}`)
  const text = await res.text()
  if (text.includes('"error"')) throw new Error(`Invalid asset ${name}`)
  await writeFile(target, text)
  console.log('Saved', name)
}

console.log('All assets downloaded.')
