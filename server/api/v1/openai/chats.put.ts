export default defineEventHandler(async (event) => {
  const incoming = await readBody<{ currentProfileId: string, profiles: Record<string, any> }>(event)
  // TODO: validate shape if needed
  setSnapshot(incoming || { currentProfileId: '', profiles: {} })
  return { ok: true }
})
