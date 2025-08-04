export default defineEventHandler(async (event) => {
  const payload = { ...getQuery(event) }
  const { result } = await runTask('keepWarm', { payload })
  return { result }
})
