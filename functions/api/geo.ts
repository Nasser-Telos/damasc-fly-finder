export const onRequest: PagesFunction = async ({ request }) => {
  const cf = (request as Request & { cf?: IncomingRequestCfProperties }).cf;

  return Response.json(
    {
      country_code: cf?.country ?? null,
      city: cf?.city ?? null,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
};
