export type SavedPlan = {
  name: string
  audience: string
  blocks: { title: string }[]
}

export function planForGroup(plans: SavedPlan[], groupName: string) {
  const group = groupName.trim().toLowerCase()
  const specific = plans.find((plan) => {
    const audience = plan.audience.trim().toLowerCase()
    if (!audience || audience === 'все группы') return false
    return group.includes(audience) || audience.includes(group)
  })
  return specific ?? plans.find((plan) => plan.audience.trim().toLowerCase() === 'все группы') ?? null
}
